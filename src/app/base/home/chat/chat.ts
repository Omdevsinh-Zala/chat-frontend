import {
  AfterViewInit,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  model,
  OnInit,
  signal,
  viewChildren,
  WritableSignal,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { SocketConnection } from '../../../services/socket-connection';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Chat as ChatMessage } from '../../../models/chat';
import { UserService } from '../../../services/user-service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-chat',
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, MatIcon, FormsModule, DatePipe],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat implements OnInit, AfterViewInit {
  private socketService = inject(SocketConnection);
  private router = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private chatId = signal('');
  userData = inject(UserService);
  private injector = inject(Injector);

  messageItems = viewChildren<ElementRef>('messageItem');
  private observer: IntersectionObserver | null = null;

  currentChatMessages: WritableSignal<ChatMessage[]> = signal<ChatMessage[]>([]);
  message = model('');

  ngOnInit(): void {
    this.router.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params: any) => {
      const previousChatId = this.chatId();
      if (previousChatId) {
        this.socketService.socket.off(`chatMessagesReceive-${previousChatId}`);
        this.socketService.socket.off('chatMessages');
      }

      this.chatId.set(params['id']);
      this.currentChatMessages.set([]);

      this.socketService.socket.emit('chatChange', { receiverId: this.chatId() });

      this.socketService.socket.on('chatMessages', (data: { chat: ChatMessage[] }) => {
        this.currentChatMessages.set(data.chat.reverse());
      });

      this.socketService.socket.on('receiveChatMessage', (data: { chat: ChatMessage }) => {
        // Only process messages that belong to this chat:
        // 1. Messages I sent to this person (sender: me, receiver: chatId)
        // 2. Messages this person sent to me (sender: chatId, receiver: me)
        const isMyMessage = data.chat.sender_id === this.userData.user()?.id && data.chat.receiver_id === this.chatId();
        const isTheirMessage = data.chat.sender_id === this.chatId() && data.chat.receiver_id === this.userData.user()?.id;
        
        if (!isMyMessage && !isTheirMessage) return;
        
        this.currentChatMessages.update((chat) => {
          const index = chat.findIndex((e) => e.id === data.chat.id);
          if (index === -1) {
            // New message - add it to the top
            const newData = [data.chat, ...chat];
            return structuredClone(newData);
          } else {
            // Existing message - update it (e.g., status change)
            chat[index] = data.chat;
            return structuredClone(chat);
          }
        });
      });
    });

    this.destroyRef.onDestroy(() => {
      const currentId = this.chatId();
      if (currentId) {
        this.socketService.socket.off('receiveChatMessage');
        this.socketService.socket.off('chatMessages');
      }
      this.observer?.disconnect();
    });

    this.setupObserver();
  }

  ngAfterViewInit(): void {
    effect(() => {
      const items = this.messageItems();
      items.forEach((item) => {
        this.observer?.observe(item.nativeElement);
      });
    }, { injector: this.injector });
  }

  private setupObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) { 
              const messageId = entry.target.getAttribute('data-id');
              if (messageId) {
                // Find the message in our array to check who sent it
                const message = this.currentChatMessages().find(m => m.id === messageId);
                
                // Only mark as read if:
                // 1. Message was sent by the OTHER user (sender is chatId)
                // 2. Message was received by ME (receiver is current user)
                // 3. Message is not already marked as 'read'
                if (message && 
                    message.sender_id === this.chatId() && 
                    message.receiver_id === this.userData.user()?.id &&
                    message.status !== 'read') {
                  this.socketService.socket.emit('readMessage', {
                    messageId,
                    receiverId: this.userData.user()?.id,
                  });
                }
                // Always unobserve after processing to avoid duplicate handling
                this.observer?.unobserve(entry.target);
              }
          }
        });
      },
      {
        root: null, // viewport
        threshold: 0.5, // 50% visibility
      }
    );
  }

  clickEvent(event: MouseEvent) {
    this.sendMessage();
    event.stopPropagation();
  }

  sendMessage() {
    if (!this.message()) return;
    this.socketService.socket.emit('chatMessagesSend', {
      message: this.message(),
      receiverId: this.chatId(),
    });
    this.message.set('');
  }
}
