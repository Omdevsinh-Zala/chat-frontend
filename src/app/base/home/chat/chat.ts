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
      // 1. Clean up previous listeners if any
      const previousChatId = this.chatId();
      if (previousChatId) {
        this.socketService.socket.off(`chatMessagesReceive-${previousChatId}`);
        this.socketService.socket.off('chatMessages');
      }

      // 2. Set new chat ID
      this.chatId.set(params['id']);
      this.currentChatMessages.set([]);

      // 3. Emit chat change event
      this.socketService.socket.emit('chatChange', { receiverId: this.chatId() });

      // 4. Listen for initial chat history
      this.socketService.socket.on('chatMessages', (data: { chat: ChatMessage[] }) => {
        console.log(data.chat)
        this.currentChatMessages.set(data.chat.reverse());
      });

      // 5. Listen for new messages
      this.socketService.socket.on('receiveChatMessage', (data: { chat: ChatMessage }) => {
        // Case 1: Message I sent (echo back)
        if (
          data.chat.receiver_id === this.chatId() &&
          data.chat.sender_id === this.userData.user()?.id
        ) {
          this.currentChatMessages.update((chat) => {
            const newData = [data.chat, ...chat];
            return structuredClone(newData);
          });
        }
        // Case 2: Message received from the person I'm chatting with
        else if (data.chat.sender_id === this.chatId()) {
          this.currentChatMessages.update((chat) => {
            const newData = [data.chat, ...chat];
            return structuredClone(newData);
          });
        }
      });
    });

    // Cleanup when component is destroyed
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
              this.socketService.socket.emit('readMessage', {
                messageId,
                chatId: this.chatId(),
              });
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
