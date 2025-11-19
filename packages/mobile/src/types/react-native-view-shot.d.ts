/**
 * Type declarations for react-native-view-shot
 * This is a temporary type declaration until the package is properly installed
 */

declare module 'react-native-view-shot' {
  import { Component, RefObject } from 'react';
  import { ViewProps } from 'react-native';

  export interface CaptureOptions {
    format?: 'png' | 'jpg' | 'webm';
    quality?: number;
    result?: 'tmpfile' | 'base64' | 'data-uri' | 'zip-base64';
    snapshotContentContainer?: boolean;
    width?: number;
    height?: number;
  }

  export function captureRef<T = any>(
    view: number | RefObject<T>,
    options?: CaptureOptions
  ): Promise<string>;

  export function captureScreen(options?: CaptureOptions): Promise<string>;

  export function releaseCapture(uri: string): void;

  export interface ViewShotProps extends ViewProps {
    onCapture?: (uri: string) => void;
    captureMode?: 'mount' | 'continuous' | 'update';
    options?: CaptureOptions;
  }

  export default class ViewShot extends Component<ViewShotProps> {
    capture(): Promise<string>;
  }
}
