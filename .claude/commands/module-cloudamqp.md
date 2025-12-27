# CloudAMQP Infrastructure Module Command

> **NOTICE - PHASE 1:** Ce module N'EST PAS NECESSAIRE pour Phase 1.
> L'architecture simplifiee utilise FastAPI BackgroundTasks pour les notifications.
> CloudAMQP est reserve pour Phase 3+ si le volume de traitement le justifie.
>
> **Voir:** `Documentations/workflow/ARCHITECTURE_SIMPLIFIEE_PHASE1.md`
>
> **Alternative Phase 1:** Utiliser `/workflow-service-request` pour le traitement synchrone.

---

## Original Documentation (Reserve pour Phase 3+)

Implement the CloudAMQP (RabbitMQ) message broker infrastructure for asynchronous workflow processing.

## Context

**CloudAMQP Module** provides message queue infrastructure for TaxasGE:
- **Decoupled Processing** (API → Queue → Workers)
- **Reliability** (durable queues, message persistence)
- **Scalability** (multiple workers, prefetch control)
- **Error Handling** (retries, dead-letter queues)
- **Monitoring** (message counts, consumer status)

## Documentation Reference

**IMPORTANT:** Read architecture documentation first:
```bash
Read Documentations/workflow/RAPPORT_ARCHITECTURE_AGENTS_IA.md
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CLOUDAMQP INFRASTRUCTURE                                  │
└─────────────────────────────────────────────────────────────────────────────┘

  BACKEND API                 CLOUDAMQP                        WORKERS
  ───────────                 ─────────                        ───────

  POST /upload
       │
       ▼
  ┌──────────┐           ┌───────────────────┐           ┌──────────────┐
  │ Publish  │──────────▶│ Exchange: taxasge │──────────▶│ Doc Worker   │
  │ Message  │           │ Type: topic       │           │ (2 instances)│
  └──────────┘           └─────────┬─────────┘           └──────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
               ┌─────────┐   ┌─────────┐   ┌─────────┐
               │documents│   │risk-    │   │notifi-  │
               │ queue   │   │analysis │   │cations  │
               └─────────┘   └─────────┘   └─────────┘
                    │              │              │
                    ▼              ▼              ▼
               ┌─────────┐   ┌─────────┐   ┌─────────┐
               │Document │   │  Risk   │   │  Notif  │
               │ Worker  │   │ Worker  │   │ Worker  │
               └─────────┘   └─────────┘   └─────────┘
```

## CloudAMQP Configuration

### Plan: Little Lemur (Free)

| Limit | Value |
|-------|-------|
| Messages/month | 1,000,000 |
| Connections | 20 |
| Channels/connection | 200 |
| Queue limit | None |

### Queues

| Queue | Description | TTL | DLQ |
|-------|-------------|-----|-----|
| `documents` | Document AI processing | 24h | Yes |
| `risk-analysis` | Gemini risk analysis | 1h | Yes |
| `calculations` | RBC tariff calculation | 5min | Yes |
| `notifications` | Email/SMS sending | 24h | Yes |
| `workflow-events` | Workflow state changes | 1h | No |
| `dlq` | Dead letter queue | 7 days | No |

### Exchanges

| Exchange | Type | Routing |
|----------|------|---------|
| `taxasge` | topic | Main exchange |
| `dlx` | direct | Dead letter exchange |

## Target Module Structure

```
packages/backend/app/core/messaging/
├── __init__.py
├── config.py                      # Queue/Exchange config
├── client.py                      # AMQP client (aio-pika)
├── publisher.py                   # Message publishing
├── consumer.py                    # Base consumer class
├── message_schemas.py             # Message dataclasses
├── retry_policy.py                # Retry/backoff logic
└── health_check.py                # Connection health

packages/backend/app/workers/
├── __init__.py
├── base_worker.py                 # Abstract worker class
├── document_worker.py             # Document AI consumer
├── risk_worker.py                 # Gemini risk consumer
├── rbc_worker.py                  # RBC calculation consumer
├── notification_worker.py         # Email/SMS consumer
└── runner.py                      # Worker runner script
```

## Instructions

### Step 1: Read Existing Code
```bash
Read packages/backend/app/modules/communications/services/
Read Documentations/workflow/RAPPORT_ARCHITECTURE_AGENTS_IA.md (Section 6)
```

### Step 2: Use Subagents for Development

Launch 3 subagents in parallel:

#### Subagent 1: Core AMQP Infrastructure
```markdown
Task: Implement core CloudAMQP client and configuration

1. Create AMQP Configuration (config.py):
   ```python
   from dataclasses import dataclass
   from typing import Optional, Dict, Any

   @dataclass
   class QueueConfig:
       name: str
       durable: bool = True
       exclusive: bool = False
       auto_delete: bool = False
       arguments: Optional[Dict[str, Any]] = None

   @dataclass
   class ExchangeConfig:
       name: str
       type: str = "topic"
       durable: bool = True
       auto_delete: bool = False

   EXCHANGES = {
       "main": ExchangeConfig(name="taxasge", type="topic"),
       "dlx": ExchangeConfig(name="dlx", type="direct"),
   }

   QUEUES = {
       "documents": QueueConfig(
           name="documents",
           arguments={
               "x-message-ttl": 86400000,  # 24h
               "x-dead-letter-exchange": "dlx",
               "x-dead-letter-routing-key": "dlq.documents"
           }
       ),
       "risk-analysis": QueueConfig(
           name="risk-analysis",
           arguments={
               "x-message-ttl": 3600000,  # 1h
               "x-dead-letter-exchange": "dlx",
               "x-dead-letter-routing-key": "dlq.risk"
           }
       ),
       "calculations": QueueConfig(
           name="calculations",
           arguments={
               "x-message-ttl": 300000,  # 5min
               "x-dead-letter-exchange": "dlx",
               "x-dead-letter-routing-key": "dlq.calculations"
           }
       ),
       "notifications": QueueConfig(
           name="notifications",
           arguments={
               "x-message-ttl": 86400000,  # 24h
               "x-dead-letter-exchange": "dlx",
               "x-dead-letter-routing-key": "dlq.notifications"
           }
       ),
       "workflow-events": QueueConfig(
           name="workflow-events",
           arguments={"x-message-ttl": 3600000}  # 1h, no DLQ
       ),
       "dlq": QueueConfig(
           name="dlq",
           arguments={"x-message-ttl": 604800000}  # 7 days
       ),
   }

   BINDINGS = {
       "documents": [
           {"exchange": "taxasge", "routing_key": "document.*"},
       ],
       "risk-analysis": [
           {"exchange": "taxasge", "routing_key": "risk.*"},
       ],
       "calculations": [
           {"exchange": "taxasge", "routing_key": "calculation.*"},
       ],
       "notifications": [
           {"exchange": "taxasge", "routing_key": "notification.*"},
       ],
       "workflow-events": [
           {"exchange": "taxasge", "routing_key": "workflow.*"},
       ],
   }
   ```

2. Create AMQP Client (client.py):
   ```python
   import aio_pika
   from aio_pika import Connection, Channel, Exchange, Queue
   from typing import Optional
   from loguru import logger

   class AMQPClient:
       def __init__(self, url: str):
           self.url = url
           self._connection: Optional[Connection] = None
           self._channel: Optional[Channel] = None
           self._exchanges: dict[str, Exchange] = {}
           self._queues: dict[str, Queue] = {}

       async def connect(self) -> None:
           """Establish connection and setup infrastructure"""
           logger.info("Connecting to CloudAMQP...")

           self._connection = await aio_pika.connect_robust(
               self.url,
               client_properties={"connection_name": "taxasge-backend"}
           )

           self._channel = await self._connection.channel()

           # Declare exchanges
           for name, config in EXCHANGES.items():
               self._exchanges[name] = await self._channel.declare_exchange(
                   config.name,
                   config.type,
                   durable=config.durable
               )
               logger.info(f"Declared exchange: {config.name}")

           # Declare queues
           for name, config in QUEUES.items():
               self._queues[name] = await self._channel.declare_queue(
                   config.name,
                   durable=config.durable,
                   arguments=config.arguments
               )
               logger.info(f"Declared queue: {config.name}")

           # Create bindings
           for queue_name, bindings in BINDINGS.items():
               queue = self._queues[queue_name]
               for binding in bindings:
                   exchange = self._exchanges.get(
                       binding["exchange"].replace("taxasge", "main")
                   )
                   await queue.bind(exchange, binding["routing_key"])
                   logger.info(
                       f"Bound {queue_name} to {binding['exchange']} "
                       f"with key {binding['routing_key']}"
                   )

           logger.info("CloudAMQP infrastructure ready")

       async def disconnect(self) -> None:
           if self._connection:
               await self._connection.close()

       @property
       def channel(self) -> Channel:
           if not self._channel:
               raise RuntimeError("Not connected")
           return self._channel

       def get_exchange(self, name: str) -> Exchange:
           return self._exchanges[name]

       def get_queue(self, name: str) -> Queue:
           return self._queues[name]
   ```

3. Create Health Check:
   ```python
   class AMQPHealthCheck:
       def __init__(self, client: AMQPClient):
           self.client = client

       async def check(self) -> dict:
           try:
               # Check connection
               if not self.client._connection or self.client._connection.is_closed:
                   return {"status": "unhealthy", "error": "disconnected"}

               # Get queue stats
               stats = {}
               for name, queue in self.client._queues.items():
                   declaration = await queue.declare()
                   stats[name] = {
                       "messages": declaration.message_count,
                       "consumers": declaration.consumer_count
                   }

               return {
                   "status": "healthy",
                   "queues": stats
               }

           except Exception as e:
               return {"status": "unhealthy", "error": str(e)}
   ```

Return: AMQP config, client, health check
```

#### Subagent 2: Publisher & Message Schemas
```markdown
Task: Implement message publishing and schemas

1. Create Message Schemas (message_schemas.py):
   ```python
   from dataclasses import dataclass, asdict
   from datetime import datetime
   from typing import Optional, Dict, Any
   from uuid import uuid4
   import json

   @dataclass
   class BaseMessage:
       message_id: str = None
       correlation_id: str = None
       timestamp: str = None

       def __post_init__(self):
           if not self.message_id:
               self.message_id = str(uuid4())
           if not self.timestamp:
               self.timestamp = datetime.utcnow().isoformat()

       def to_bytes(self) -> bytes:
           return json.dumps(asdict(self)).encode()

       @classmethod
       def from_bytes(cls, data: bytes):
           return cls(**json.loads(data.decode()))

   @dataclass
   class DocumentUploadedMessage(BaseMessage):
       file_id: str = None
       user_id: str = None
       service_code: str = None
       workflow_id: str = None
       storage_url: str = None
       mime_type: str = None
       retry_count: int = 0

   @dataclass
   class DocumentProcessedMessage(BaseMessage):
       file_id: str = None
       service_request_id: str = None
       document_type: str = None
       classification_confidence: float = None
       extracted_entities: Dict[str, Any] = None
       validation_result: Dict[str, Any] = None

   @dataclass
   class RiskAnalysisRequestMessage(BaseMessage):
       service_request_id: str = None
       user_id: str = None
       extracted_entities: Dict[str, Any] = None
       calculated_amount: float = None
       service_info: Dict[str, Any] = None

   @dataclass
   class RiskAnalysisResultMessage(BaseMessage):
       service_request_id: str = None
       risk_score: float = None
       risk_level: str = None
       recommendation: str = None
       justification: str = None

   @dataclass
   class CalculationRequestMessage(BaseMessage):
       service_request_id: str = None
       fiscal_service_id: int = None
       is_renewal: bool = False
       is_express: bool = False
       is_duplicate: bool = False
       due_date: Optional[str] = None
       variables: Optional[Dict[str, float]] = None
       retry_count: int = 0

   @dataclass
   class NotificationMessage(BaseMessage):
       notification_type: str = None  # email, sms, push
       recipient: str = None
       template_code: str = None
       template_data: Dict[str, Any] = None
       priority: str = "normal"  # low, normal, high
       retry_count: int = 0

   @dataclass
   class WorkflowEventMessage(BaseMessage):
       service_request_id: str = None
       event_type: str = None  # state_changed, error, completed
       from_state: str = None
       to_state: str = None
       triggered_by: str = None  # user_id or "system"
       details: Dict[str, Any] = None
   ```

2. Create Publisher (publisher.py):
   ```python
   import aio_pika
   from aio_pika import Message, DeliveryMode
   from typing import Optional
   from loguru import logger

   class MessagePublisher:
       def __init__(self, client: AMQPClient):
           self.client = client

       async def publish(
           self,
           routing_key: str,
           message: BaseMessage,
           exchange_name: str = "main",
           priority: int = 0,
           expiration: Optional[int] = None
       ) -> None:
           """Publish message to exchange with routing key"""

           exchange = self.client.get_exchange(exchange_name)

           amqp_message = Message(
               body=message.to_bytes(),
               content_type="application/json",
               delivery_mode=DeliveryMode.PERSISTENT,
               message_id=message.message_id,
               correlation_id=message.correlation_id,
               timestamp=datetime.utcnow(),
               priority=priority,
               expiration=str(expiration) if expiration else None
           )

           await exchange.publish(
               amqp_message,
               routing_key=routing_key
           )

           logger.info(
               f"Published message {message.message_id} "
               f"to {exchange_name}/{routing_key}"
           )

       # Convenience methods
       async def publish_document_uploaded(
           self,
           file_id: str,
           user_id: str,
           service_code: str,
           storage_url: str,
           mime_type: str,
           workflow_id: Optional[str] = None
       ) -> str:
           message = DocumentUploadedMessage(
               file_id=file_id,
               user_id=user_id,
               service_code=service_code,
               workflow_id=workflow_id,
               storage_url=storage_url,
               mime_type=mime_type
           )
           await self.publish("document.uploaded", message)
           return message.message_id

       async def publish_risk_analysis_request(
           self,
           service_request_id: str,
           user_id: str,
           extracted_entities: Dict,
           calculated_amount: float,
           service_info: Dict
       ) -> str:
           message = RiskAnalysisRequestMessage(
               service_request_id=service_request_id,
               user_id=user_id,
               extracted_entities=extracted_entities,
               calculated_amount=calculated_amount,
               service_info=service_info
           )
           await self.publish("risk.analyze", message)
           return message.message_id

       async def publish_notification(
           self,
           notification_type: str,
           recipient: str,
           template_code: str,
           template_data: Dict,
           priority: str = "normal"
       ) -> str:
           message = NotificationMessage(
               notification_type=notification_type,
               recipient=recipient,
               template_code=template_code,
               template_data=template_data,
               priority=priority
           )
           await self.publish("notification.send", message)
           return message.message_id
   ```

3. Create Retry Policy (retry_policy.py):
   ```python
   from dataclasses import dataclass
   from typing import List, Optional

   @dataclass
   class RetryPolicy:
       max_retries: int = 3
       delay_ms: List[int] = None  # Exponential backoff
       on_max_retries: str = "dlq"  # "dlq" or "drop"

       def __post_init__(self):
           if not self.delay_ms:
               self.delay_ms = [1000, 5000, 30000]  # 1s, 5s, 30s

       def get_delay(self, retry_count: int) -> int:
           if retry_count < len(self.delay_ms):
               return self.delay_ms[retry_count]
           return self.delay_ms[-1]

       def should_retry(self, retry_count: int) -> bool:
           return retry_count < self.max_retries

   RETRY_POLICIES = {
       "documents": RetryPolicy(max_retries=3, delay_ms=[1000, 5000, 30000]),
       "risk-analysis": RetryPolicy(max_retries=2, delay_ms=[500, 2000]),
       "calculations": RetryPolicy(max_retries=1, delay_ms=[500]),
       "notifications": RetryPolicy(max_retries=5, delay_ms=[1000, 5000, 30000, 60000, 300000]),
   }
   ```

Return: Message schemas, publisher, retry policies
```

#### Subagent 3: Base Worker & Runner
```markdown
Task: Create base worker class and runner script

1. Create Base Worker (base_worker.py):
   ```python
   from abc import ABC, abstractmethod
   import aio_pika
   from aio_pika import IncomingMessage
   from typing import Optional, Type
   from loguru import logger
   import asyncio

   class BaseWorker(ABC):
       """Abstract base class for all queue workers"""

       QUEUE_NAME: str = None
       PREFETCH_COUNT: int = 10
       MESSAGE_CLASS: Type[BaseMessage] = None

       def __init__(self, amqp_client: AMQPClient):
           self.client = amqp_client
           self.queue: Optional[aio_pika.Queue] = None
           self._running = False

       async def start(self) -> None:
           """Start consuming messages"""
           if not self.QUEUE_NAME:
               raise ValueError("QUEUE_NAME must be set")

           await self.client.channel.set_qos(prefetch_count=self.PREFETCH_COUNT)

           self.queue = self.client.get_queue(self.QUEUE_NAME)

           logger.info(f"Starting {self.__class__.__name__} on queue {self.QUEUE_NAME}")

           self._running = True
           await self.queue.consume(self._handle_message)

       async def stop(self) -> None:
           """Stop consuming messages"""
           self._running = False
           if self.queue:
               await self.queue.cancel(consumer_tag=self.QUEUE_NAME)

       async def _handle_message(self, message: IncomingMessage) -> None:
           """Process incoming message with error handling"""
           try:
               async with message.process():
                   # Parse message
                   if self.MESSAGE_CLASS:
                       msg = self.MESSAGE_CLASS.from_bytes(message.body)
                   else:
                       msg = json.loads(message.body.decode())

                   logger.info(
                       f"Processing message {message.message_id} "
                       f"in {self.__class__.__name__}"
                   )

                   # Process
                   start_time = time.time()
                   await self.process_message(msg)
                   duration = (time.time() - start_time) * 1000

                   logger.info(
                       f"Processed message {message.message_id} "
                       f"in {duration:.2f}ms"
                   )

           except Exception as e:
               logger.error(f"Error processing message: {e}")
               await self._handle_error(message, e)

       async def _handle_error(
           self,
           message: IncomingMessage,
           error: Exception
       ) -> None:
           """Handle processing errors with retry logic"""
           msg_data = json.loads(message.body.decode())
           retry_count = msg_data.get("retry_count", 0)

           policy = RETRY_POLICIES.get(
               self.QUEUE_NAME,
               RetryPolicy()
           )

           if policy.should_retry(retry_count):
               # Retry with delay
               msg_data["retry_count"] = retry_count + 1
               delay = policy.get_delay(retry_count)

               logger.warning(
                   f"Retrying message {message.message_id} "
                   f"(attempt {retry_count + 1}/{policy.max_retries}) "
                   f"after {delay}ms"
               )

               await asyncio.sleep(delay / 1000)

               # Re-publish
               await self.client.get_exchange("main").publish(
                   aio_pika.Message(
                       body=json.dumps(msg_data).encode(),
                       delivery_mode=DeliveryMode.PERSISTENT
                   ),
                   routing_key=message.routing_key
               )

           else:
               # Send to DLQ or drop
               if policy.on_max_retries == "dlq":
                   logger.error(
                       f"Message {message.message_id} exceeded max retries, "
                       f"sending to DLQ"
                   )
                   await self._send_to_dlq(message, str(error))
               else:
                   logger.error(
                       f"Message {message.message_id} exceeded max retries, dropping"
                   )

       async def _send_to_dlq(
           self,
           message: IncomingMessage,
           error: str
       ) -> None:
           """Send message to dead letter queue"""
           dlq_message = {
               "original_message": json.loads(message.body.decode()),
               "error": error,
               "original_queue": self.QUEUE_NAME,
               "failed_at": datetime.utcnow().isoformat()
           }

           await self.client.get_exchange("dlx").publish(
               aio_pika.Message(
                   body=json.dumps(dlq_message).encode(),
                   delivery_mode=DeliveryMode.PERSISTENT
               ),
               routing_key=f"dlq.{self.QUEUE_NAME}"
           )

       @abstractmethod
       async def process_message(self, message: BaseMessage) -> None:
           """Process a single message - must be implemented by subclasses"""
           pass
   ```

2. Create Worker Runner (runner.py):
   ```python
   import asyncio
   import signal
   from loguru import logger
   from typing import List, Type

   from app.core.messaging.client import AMQPClient
   from app.workers.base_worker import BaseWorker
   from app.workers.document_worker import DocumentWorker
   from app.workers.risk_worker import RiskWorker
   from app.workers.rbc_worker import RBCWorker
   from app.workers.notification_worker import NotificationWorker
   from app.config import settings

   WORKERS: List[Type[BaseWorker]] = [
       DocumentWorker,
       RiskWorker,
       RBCWorker,
       NotificationWorker,
   ]

   class WorkerRunner:
       def __init__(self, worker_types: List[str] = None):
           self.amqp_client = AMQPClient(settings.CLOUDAMQP_URL)
           self.workers: List[BaseWorker] = []
           self.worker_types = worker_types or ["all"]

       async def start(self):
           """Start all workers"""
           # Connect to AMQP
           await self.amqp_client.connect()
           logger.info("Connected to CloudAMQP")

           # Initialize workers
           for worker_class in WORKERS:
               if self.worker_types == ["all"] or \
                  worker_class.QUEUE_NAME in self.worker_types:
                   worker = worker_class(self.amqp_client)
                   self.workers.append(worker)
                   await worker.start()

           logger.info(f"Started {len(self.workers)} workers")

       async def stop(self):
           """Stop all workers"""
           logger.info("Stopping workers...")
           for worker in self.workers:
               await worker.stop()

           await self.amqp_client.disconnect()
           logger.info("All workers stopped")

       async def run_forever(self):
           """Run workers until interrupted"""
           await self.start()

           # Handle shutdown signals
           loop = asyncio.get_event_loop()
           for sig in (signal.SIGINT, signal.SIGTERM):
               loop.add_signal_handler(sig, lambda: asyncio.create_task(self.stop()))

           # Keep running
           try:
               while True:
                   await asyncio.sleep(1)
           except asyncio.CancelledError:
               pass
           finally:
               await self.stop()

   # Entry point
   async def main():
       import sys
       worker_types = sys.argv[1:] if len(sys.argv) > 1 else ["all"]
       runner = WorkerRunner(worker_types)
       await runner.run_forever()

   if __name__ == "__main__":
       asyncio.run(main())
   ```

3. Add to requirements.txt:
   ```txt
   aio-pika>=9.3.0
   pika>=1.3.2  # For sync operations if needed
   ```

4. Create Docker/deployment config:
   ```yaml
   # docker-compose.workers.yml
   version: '3.8'
   services:
     document-worker:
       build: .
       command: python -m app.workers.runner documents
       environment:
         - CLOUDAMQP_URL=${CLOUDAMQP_URL}
       deploy:
         replicas: 2

     risk-worker:
       build: .
       command: python -m app.workers.runner risk-analysis
       environment:
         - CLOUDAMQP_URL=${CLOUDAMQP_URL}
       deploy:
         replicas: 1

     rbc-worker:
       build: .
       command: python -m app.workers.runner calculations
       environment:
         - CLOUDAMQP_URL=${CLOUDAMQP_URL}
       deploy:
         replicas: 1

     notification-worker:
       build: .
       command: python -m app.workers.runner notifications
       environment:
         - CLOUDAMQP_URL=${CLOUDAMQP_URL}
       deploy:
         replicas: 1
   ```

Return: Base worker, runner script, deployment config
```

## Environment Variables

```bash
# CloudAMQP
CLOUDAMQP_URL=amqps://user:password@rabbit.cloudamqp.com/vhost
```

## Checklist

- [ ] Create CloudAMQP account (Little Lemur free tier)
- [ ] Get connection URL and add to .env
- [ ] Implement AMQP config (queues, exchanges, bindings)
- [ ] Implement AMQP client
- [ ] Implement health check
- [ ] Create message schemas
- [ ] Implement publisher
- [ ] Implement retry policy
- [ ] Create base worker class
- [ ] Create worker runner script
- [ ] Create individual workers (document, risk, rbc, notification)
- [ ] Add deployment configuration
- [ ] Test message flow end-to-end
- [ ] Monitor queue depths
