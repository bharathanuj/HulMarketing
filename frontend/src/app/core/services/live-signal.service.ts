import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Wraps the Socket.IO connection to the backend so Live Pulse gets pushed
 * updates instead of polling — matches the "radar + control tower" UI spec.
 */
@Injectable({ providedIn: 'root' })
export class LiveSignalService implements OnDestroy {
  private readonly socket: Socket = io(environment.socketUrl);
  private readonly signal$ = new Subject<unknown>();

  constructor() {
    this.socket.on('opportunity:new', (payload) => this.signal$.next(payload));
  }

  onNewOpportunity(): Observable<unknown> {
    return this.signal$.asObservable();
  }

  ngOnDestroy(): void {
    this.socket.disconnect();
  }
}
