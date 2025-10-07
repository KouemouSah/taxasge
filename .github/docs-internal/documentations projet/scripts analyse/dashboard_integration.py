import os
import json
import requests
from datetime import datetime, timedelta
import re

class TaxasGEDashboardIntegration:
    def __init__(self, token, repo_owner, repo_name):
        self.token = token
        self.repo_owner = repo_owner
        self.repo_name = repo_name
        
        self.headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "TaxasGE-Dashboard-Integration/1.0"
        }
    
    def load_existing_contexts(self):
        """Charge tous les contextes existants"""
        print("📄 Chargement des contextes existants...")
        
        contexts = {}
        
        # Historical context
        try:
            with open("docs/historical-context.json", 'r', encoding='utf-8') as f:
                contexts["historical"] = json.load(f)
            print("✅ Contexte historique chargé")
        except Exception as e:
            print(f"⚠️  Contexte historique manquant: {e}")
            contexts["historical"] = None
        
        # Project summary  
        try:
            with open("docs/project-summary.json", 'r', encoding='utf-8') as f:
                contexts["project"] = json.load(f)
            print("✅ Résumé projet chargé")
        except Exception as e:
            print(f"⚠️  Résumé projet manquant: {e}")
            contexts["project"] = None
        
        # Milestone summary
        try:
            with open("docs/milestone-summary.json", 'r', encoding='utf-8') as f:
                contexts["milestones"] = json.load(f)
            print("✅ Résumé milestones chargé")
        except Exception as e:
            print(f"⚠️  Résumé milestones manquant: {e}")
            contexts["milestones"] = None
        
        return contexts
    
    def fetch_live_metrics(self):
        """Récupère les métriques en temps réel"""
        print("📊 Récupération des métriques temps réel...")
        
        metrics = {
            "milestones": self.get_milestone_metrics(),
            "issues": self.get_issue_metrics(),
            "project": self.get_project_metrics(),
            "activity": self.get_activity_metrics()
        }
        
        return metrics
    
    def get_milestone_metrics(self):
        """Métriques des milestones"""
        url = f"https://api.github.com/repos/{self.repo_owner}/{self.repo_name}/milestones"
        params = {"state": "all", "per_page": 100}
        
        response = requests.get(url, headers=self.headers, params=params)
        
        if response.status_code != 200:
            print(f"⚠️  Erreur récupération milestones: {response.status_code}")
            return {"error": "api_error"}
        
        milestones = response.json()
        
        total = len(milestones)
        closed = len([m for m in milestones if m["state"] == "closed"])
        open_milestones = [m for m in milestones if m["state"] == "open"]
        
        # Critical path detection
        critical_milestone = None
        for m in milestones:
            if "Critical Path" in m["title"] or "critique" in m["title"].lower():
                critical_milestone = {
                    "title": m["title"],
                    "due_on": m.get("due_on"),
                    "open_issues": m.get("open_issues", 0),
                    "closed_issues": m.get("closed_issues", 0)
                }
                break
        
        return {
            "total": total,
            "completed": closed,
            "active": len(open_milestones),
            "completion_rate": round((closed / total) * 100, 1) if total > 0 else 0,
            "critical_path": critical_milestone
        }
    
    def get_issue_metrics(self):
        """Métriques des issues"""
        # Issues ouvertes
        url = f"https://api.github.com/repos/{self.repo_owner}/{self.repo_name}/issues"
        params = {"state": "open", "per_page": 100}
        
        response = requests.get(url, headers=self.headers, params=params)
        
        if response.status_code != 200:
            return {"error": "api_error"}
        
        open_issues = response.json()
        open_issues = [i for i in open_issues if "pull_request" not in i]
        
        # Issues fermées (dernières 30)
        params = {"state": "closed", "per_page": 30}
        closed_response = requests.get(url, headers=self.headers, params=params)
        closed_issues = closed_response.json() if closed_response.status_code == 200 else []
        closed_issues = [i for i in closed_issues if "pull_request" not in i]
        
        # Analyse par priorité
        critical_issues = []
        high_priority_issues = []
        
        for issue in open_issues:
            labels = [label["name"].lower() for label in issue.get("labels", [])]
            if any("critical" in label for label in labels):
                critical_issues.append(issue)
            elif any("high" in label for label in labels):
                high_priority_issues.append(issue)
        
        return {
            "open": len(open_issues),
            "closed_recently": len(closed_issues),
            "critical": len(critical_issues),
            "high_priority": len(high_priority_issues),
            "organized": len([i for i in open_issues if i.get("milestone")])
        }
    
    def get_project_metrics(self):
        """Métriques du projet GitHub"""
        # Note: GitHub Projects V2 via GraphQL nécessiterait un token PAT
        # Pour maintenant, on utilise les données des contextes
        return {
            "exists": True,  # Nous savons qu'il existe
            "name": "🎯 TaxasGE Master Project",
            "status": "active"
        }
    
    def get_activity_metrics(self):
        """Métriques d'activité récente"""
        # Commits récents (7 derniers jours)
        since_date = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")
        
        url = f"https://api.github.com/repos/{self.repo_owner}/{self.repo_name}/commits"
        params = {"since": since_date, "per_page": 100}
        
        response = requests.get(url, headers=self.headers, params=params)
        
        if response.status_code != 200:
            return {"error": "api_error"}
        
        commits = response.json()
        
        return {
            "commits_7days": len(commits),
            "last_commit": commits[0]["commit"]["author"]["date"] if commits else None,
            "active": len(commits) > 0
        }
    
    def generate_dashboard_metrics(self, contexts, live_metrics):
        """Génère les métriques complètes pour le dashboard"""
        print("🎯 Génération des métriques dashboard...")
        
        # Progression globale (from historical context)
        overall_progress = 62.5  # Default
        if contexts["historical"]:
            overall_progress = contexts["historical"]["metadata"]["overall_progress"]
        
        # Phase progress (from historical context)
        phase_progress = {
            "infrastructure": 95,
            "backend": 70,
            "mobile": 60,
            "dashboard": 90,
            "production": 20,
            "business": 10
        }
        
        if contexts["historical"] and "phases" in contexts["historical"]:
            phases = contexts["historical"]["phases"]
            phase_progress = {
                "infrastructure": phases.get("phase_0_infrastructure", {}).get("completion", 95),
                "backend": phases.get("phase_1_backend", {}).get("completion", 70),
                "mobile": phases.get("phase_2_mobile", {}).get("completion", 60),
                "dashboard": phases.get("phase_3_dashboard", {}).get("completion", 90),
                "production": phases.get("phase_4_production", {}).get("completion", 20),
                "business": phases.get("phase_5_business", {}).get("completion", 10)
            }
        
        # Critical path info
        critical_path = "Mobile AI Integration"
        critical_due_date = None
        
        if live_metrics["milestones"]["critical_path"]:
            critical_path = live_metrics["milestones"]["critical_path"]["title"]
            critical_due_date = live_metrics["milestones"]["critical_path"]["due_on"]
        
        dashboard_metrics = {
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "repository": f"{self.repo_owner}/{self.repo_name}",
                "type": "dashboard_project_metrics"
            },
            "project_overview": {
                "overall_progress": overall_progress,
                "phase_progress": phase_progress,
                "status": "active",
                "confidence_level": "high"
            },
            "milestones": {
                "total": live_metrics["milestones"]["total"],
                "completed": live_metrics["milestones"]["completed"],
                "active": live_metrics["milestones"]["active"],
                "completion_rate": live_metrics["milestones"]["completion_rate"]
            },
            "issues": {
                "open": live_metrics["issues"]["open"],
                "critical": live_metrics["issues"]["critical"],
                "high_priority": live_metrics["issues"]["high_priority"],
                "organized": live_metrics["issues"]["organized"]
            },
            "critical_path": {
                "name": critical_path,
                "due_date": critical_due_date,
                "blocking": "Production & Business phases",
                "priority": "MAXIMUM"
            },
            "activity": {
                "commits_last_week": live_metrics["activity"]["commits_7days"],
                "last_commit": live_metrics["activity"]["last_commit"],
                "project_active": live_metrics["activity"]["active"]
            },
            "recommendations": {
                "immediate": ["Focus Mobile AI Integration", "Finaliser Dashboard GitHub Pages"],
                "this_week": ["Compléter tests Backend", "Préparer audit sécurité"],
                "next_month": ["Déploiement production", "Intégration paiements Bange"]
            }
        }
        
        return dashboard_metrics
    
    def update_dashboard_html(self, metrics):
        """Met à jour le dashboard HTML avec les nouvelles métriques"""
        print("🎨 Mise à jour du dashboard HTML...")
        
        dashboard_file = None
        
        # Chercher le fichier dashboard
        possible_files = ["docs/index.html", "index.html", "docs/dashboard.html"]
        for file_path in possible_files:
            if os.path.exists(file_path):
                dashboard_file = file_path
                break
        
        if not dashboard_file:
            print("❌ Fichier dashboard non trouvé")
            return False
        
        print(f"📄 Dashboard trouvé: {dashboard_file}")
        
        # Lire le contenu actuel
        with open(dashboard_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Générer la section métriques projet
        project_metrics_html = self.generate_project_metrics_html(metrics)
        
        # Injecter ou remplacer la section projet
        project_section_pattern = r'<!--\s*PROJECT_METRICS_START\s*-->.*?<!--\s*PROJECT_METRICS_END\s*-->'
        
        if re.search(project_section_pattern, content, re.DOTALL):
            # Remplacer la section existante
            new_content = re.sub(
                project_section_pattern,
                f'<!-- PROJECT_METRICS_START -->\n{project_metrics_html}\n<!-- PROJECT_METRICS_END -->',
                content,
                flags=re.DOTALL
            )
            print("🔄 Section projet mise à jour")
        else:
            # Ajouter la nouvelle section avant la fermeture du body
            injection_point = content.rfind('</body>')
            if injection_point != -1:
                new_content = (
                    content[:injection_point] +
                    f'\n<!-- PROJECT_METRICS_START -->\n{project_metrics_html}\n<!-- PROJECT_METRICS_END -->\n' +
                    content[injection_point:]
                )
                print("✅ Nouvelle section projet ajoutée")
            else:
                print("⚠️  Point d'injection non trouvé")
                return False
        
        # Écrire le contenu mis à jour
        with open(dashboard_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"✅ Dashboard mis à jour: {dashboard_file}")
        return True
    
    def generate_project_metrics_html(self, metrics):
        """Génère le HTML pour les métriques projet"""
        
        # Couleurs pour les phases
        phase_colors = {
            "infrastructure": "#6f42c1",  # Purple
            "backend": "#28a745",         # Green  
            "mobile": "#dc3545",          # Red (critical)
            "dashboard": "#17a2b8",       # Cyan
            "production": "#fd7e14",      # Orange
            "business": "#007bff"         # Blue
        }
        
        html = f'''
    <section class="project-metrics-section">
        <div class="container">
            <h2 class="section-title">📊 Project Management Dashboard</h2>
            
            <!-- Overview Cards -->
            <div class="metrics-grid">
                <div class="metric-card overall-progress">
                    <h3>🎯 Progression Globale</h3>
                    <div class="progress-circle">
                        <span class="progress-value">{metrics['project_overview']['overall_progress']:.1f}%</span>
                    </div>
                    <p class="metric-status">Fondation excellente</p>
                </div>
                
                <div class="metric-card milestones">
                    <h3>🎯 Milestones</h3>
                    <div class="milestone-stats">
                        <span class="completed">{metrics['milestones']['completed']}</span>
                        <span class="separator">/</span>
                        <span class="total">{metrics['milestones']['total']}</span>
                    </div>
                    <p class="metric-status">{metrics['milestones']['completion_rate']:.1f}% complétés</p>
                </div>
                
                <div class="metric-card issues">
                    <h3>📋 Issues</h3>
                    <div class="issue-stats">
                        <span class="open-issues">{metrics['issues']['open']}</span>
                        <span class="label">ouvertes</span>
                        <span class="critical">({metrics['issues']['critical']} critiques)</span>
                    </div>
                    <p class="metric-status">{metrics['issues']['organized']} organisées</p>
                </div>
                
                <div class="metric-card critical-path">
                    <h3>🚨 Critical Path</h3>
                    <div class="critical-info">
                        <span class="critical-name">{metrics['critical_path']['name']}</span>
                    </div>
                    <p class="metric-status">Bloque phases suivantes</p>
                </div>
            </div>
            
            <!-- Phase Progress -->
            <div class="phase-progress-section">
                <h3>📈 Progression par Phase</h3>
                <div class="phases-grid">
    '''
        
        # Générer les barres de progression pour chaque phase
        phase_names = {
            "infrastructure": "🛠️ Infrastructure",
            "backend": "🐍 Backend API",
            "mobile": "📱 Mobile App",
            "dashboard": "🌐 Dashboard",
            "production": "🚀 Production",
            "business": "💳 Business"
        }
        
        for phase_key, progress in metrics['project_overview']['phase_progress'].items():
            phase_name = phase_names.get(phase_key, phase_key.title())
            color = phase_colors.get(phase_key, "#6c757d")
            
            status_class = "completed" if progress >= 90 else "critical" if progress < 30 else "active"
            
            html += f'''
                    <div class="phase-item {status_class}">
                        <div class="phase-header">
                            <span class="phase-name">{phase_name}</span>
                            <span class="phase-percentage">{progress}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: {progress}%; background-color: {color};"></div>
                        </div>
                    </div>
    '''
        
        html += '''
                </div>
            </div>
            
            <!-- Recommendations -->
            <div class="recommendations-section">
                <h3>💡 Recommandations</h3>
                <div class="recommendations-grid">
                    <div class="recommendation-card immediate">
                        <h4>🚨 Immédiat</h4>
                        <ul>
    '''
        
        for rec in metrics['recommendations']['immediate']:
            html += f'<li>{rec}</li>'
        
        html += '''
                        </ul>
                    </div>
                    <div class="recommendation-card this-week">
                        <h4>📅 Cette semaine</h4>
                        <ul>
    '''
        
        for rec in metrics['recommendations']['this_week']:
            html += f'<li>{rec}</li>'
        
        html += '''
                        </ul>
                    </div>
                    <div class="recommendation-card next-month">
                        <h4>🔮 Prochain mois</h4>
                        <ul>
    '''
        
        for rec in metrics['recommendations']['next_month']:
            html += f'<li>{rec}</li>'
        
        html += '''
                        </ul>
                    </div>
                </div>
            </div>
            
            <!-- Last Update -->
            <div class="last-update">
                <p>Dernière mise à jour: {datetime.now().strftime("%Y-%m-%d %H:%M UTC")}</p>
            </div>
        </div>
    </section>
    
    <style>
    .project-metrics-section {
        padding: 2rem 0;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        margin: 2rem 0;
        border-radius: 10px;
    }
    
    .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin: 2rem 0;
    }
    
    .metric-card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        text-align: center;
        transition: transform 0.3s ease;
    }
    
    .metric-card:hover {
        transform: translateY(-2px);
    }
    
    .metric-card h3 {
        margin: 0 0 1rem 0;
        color: #495057;
        font-size: 1.1rem;
    }
    
    .progress-circle .progress-value {
        font-size: 2.5rem;
        font-weight: bold;
        color: #28a745;
    }
    
    .milestone-stats, .issue-stats {
        font-size: 2rem;
        font-weight: bold;
    }
    
    .milestone-stats .completed {
        color: #28a745;
    }
    
    .milestone-stats .total {
        color: #6c757d;
    }
    
    .issue-stats .open-issues {
        color: #ffc107;
    }
    
    .issue-stats .critical {
        color: #dc3545;
        font-size: 1rem;
    }
    
    .critical-path .critical-name {
        font-weight: bold;
        color: #dc3545;
        font-size: 1.2rem;
    }
    
    .phases-grid {
        display: grid;
        gap: 1rem;
        margin: 1rem 0;
    }
    
    .phase-item {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        border-left: 4px solid #6c757d;
    }
    
    .phase-item.completed {
        border-left-color: #28a745;
    }
    
    .phase-item.critical {
        border-left-color: #dc3545;
    }
    
    .phase-item.active {
        border-left-color: #ffc107;
    }
    
    .phase-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }
    
    .phase-name {
        font-weight: 600;
    }
    
    .phase-percentage {
        font-weight: bold;
        color: #495057;
    }
    
    .progress-bar {
        width: 100%;
        height: 8px;
        background-color: #e9ecef;
        border-radius: 4px;
        overflow: hidden;
    }
    
    .progress-fill {
        height: 100%;
        transition: width 0.5s ease;
    }
    
    .recommendations-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin: 1rem 0;
    }
    
    .recommendation-card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .recommendation-card h4 {
        margin: 0 0 1rem 0;
        color: #495057;
    }
    
    .recommendation-card ul {
        margin: 0;
        padding-left: 1rem;
    }
    
    .recommendation-card li {
        margin: 0.5rem 0;
        color: #6c757d;
    }
    
    .last-update {
        text-align: center;
        margin-top: 2rem;
        color: #6c757d;
        font-size: 0.9rem;
    }
    </style>
    '''
        
        return html

def main():
    print("📈 TaxasGE Dashboard Integration")
    print("=================================")
    
    # Configuration
    token = os.getenv("GITHUB_TOKEN")
    repo_owner = os.getenv("REPO_OWNER")
    repo_name = os.getenv("REPO_NAME")
    update_dashboard = os.getenv("UPDATE_DASHBOARD", "true").lower() == "true"
    
    if not all([token, repo_owner, repo_name]):
        print("❌ Variables d'environnement manquantes")
        return
    
    # Initialize integrator
    integrator = TaxasGEDashboardIntegration(token, repo_owner, repo_name)
    
    # Load contexts
    contexts = integrator.load_existing_contexts()
    
    # Fetch live metrics
    live_metrics = integrator.fetch_live_metrics()
    
    # Generate dashboard metrics
    dashboard_metrics = integrator.generate_dashboard_metrics(contexts, live_metrics)
    
    # Save metrics
    with open("dashboard-metrics.json", "w", encoding='utf-8') as f:
        json.dump(dashboard_metrics, f, indent=2, ensure_ascii=False)
    
    # Update dashboard HTML
    if update_dashboard:
        success = integrator.update_dashboard_html(dashboard_metrics)
        if success:
            print("✅ Dashboard HTML mis à jour avec succès")
        else:
            print("⚠️  Dashboard HTML non mis à jour")
    
    # Results
    print(f"\n📊 TaxasGE Dashboard Integration - Résultats:")
    print(f"🎯 Progression globale: {dashboard_metrics['project_overview']['overall_progress']}%")
    print(f"📈 Milestones: {dashboard_metrics['milestones']['completed']}/{dashboard_metrics['milestones']['total']} ({dashboard_metrics['milestones']['completion_rate']}%)")
    print(f"📋 Issues ouvertes: {dashboard_metrics['issues']['open']} ({dashboard_metrics['issues']['critical']} critiques)")
    print(f"🚨 Critical path: {dashboard_metrics['critical_path']['name']}")
    print(f"⚡ Activité: {dashboard_metrics['activity']['commits_last_week']} commits cette semaine")
    
    print(f"\n✅ Dashboard integration terminée!")
    print(f"📄 Métriques sauvées: dashboard-metrics.json")
    print(f"🎨 Dashboard HTML {'mis à jour' if update_dashboard else 'non modifié'}")
    
    return dashboard_metrics

if __name__ == "__main__":
    main()
