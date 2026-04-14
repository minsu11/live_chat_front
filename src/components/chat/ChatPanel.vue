<template>
  <div class="panel">
    <header class="header">
      <div class="title">{{ roomTitle }}</div>
      <button class="icon" @click="$router.push({ name: 'homeEmpty' })">✕</button>
    </header>

    <section class="messages" ref="list">
      <div v-if="loading" class="empty">불러오는 중...</div>
      <div v-else-if="messages.length === 0" class="empty">아직 메시지가 없습니다.</div>

      <div
          v-for="m in decoratedMessages"
          :key="m.id"
          class="msg"
          :class="{ mine: m.mine, compact: m.groupedTop }"
      >
        <!-- 상대 메시지: 마지막 메시지일 때만 아바타 -->
        <div v-if="!m.mine" class="avatar-slot">
          <div v-if="m.showAvatar" class="avatar">
            <img :src="m.profileImageUrl || defaultImage" alt="profile" />
          </div>
        </div>

        <div class="msg-body" :class="{ mine: m.mine }">
          <!-- 상대 메시지: 묶음 첫 메시지일 때만 이름 -->
          <div v-if="m.showName" class="name">{{ m.name }}</div>

          <div class="message-row" :class="{ mine: m.mine }">
            <!-- 내 메시지: unread/time을 버블 왼쪽 -->
            <template v-if="m.mine && m.showMeta">
              <transition name="unread-pop">
                <div
                    v-if="m.unreadCount > 0"
                    :key="`u-${m.id}-${m.unreadCount}`"
                    class="unread-mark left"
                >
                  {{ m.unreadCount }}
                </div>
              </transition>
              <div class="meta">{{ format(m.at) }}</div>
            </template>

            <div
                class="bubble"
                :class="{
                mine: m.mine,
                groupedTop: m.groupedTop,
                groupedBottom: m.groupedBottom
              }"
            >
              <div v-if="m.type === 'EMOJI'" class="emoji-text">{{ m.text }}</div>

              <img
                  v-else-if="m.type === 'IMAGE'"
                  :src="m.text"
                  alt="chat-image"
                  class="chat-image"
              />

              <div v-else-if="m.type === 'FILE'" class="file-message">
                <a
                    :href="getFileDownloadUrl(m.text)"
                    class="file-link"
                >
                  📎 {{ getFileDisplay(m.text).fileName }}
                </a>

                <div v-if="getFileDisplay(m.text).fileSize != null" class="file-size">
                  {{ formatFileSize(getFileDisplay(m.text).fileSize) }}
                </div>
              </div>

              <div v-else class="text">{{ m.text }}</div>
            </div>

            <!-- 상대 메시지: unread/time을 버블 오른쪽 -->
            <template v-if="!m.mine && m.showMeta">
              <div class="meta">{{ format(m.at) }}</div>
              <transition name="unread-pop">
                <div
                    v-if="m.unreadCount > 0"
                    :key="`u-${m.id}-${m.unreadCount}`"
                    class="unread-mark right"
                >
                  {{ m.unreadCount }}
                </div>
              </transition>
            </template>
          </div>
        </div>
      </div>
    </section>

    <footer class="composer-wrap">
      <div v-if="showEmojiPicker" class="emoji-picker">
        <button
            v-for="emoji in emojiList"
            :key="emoji"
            type="button"
            class="emoji-btn"
            @click="pickEmoji(emoji)"
        >
          {{ emoji }}
        </button>
      </div>

      <div class="composer">
        <button type="button" class="emoji-toggle" @click="toggleEmojiPicker">😊</button>
        <button type="button" class="image-toggle" @click="openImagePicker">🖼️</button>
        <button type="button" class="file-toggle" @click="openFilePicker">📎</button>

        <input
            ref="fileInput"
            type="file"
            style="display: none"
            @change="handleFileSelected"
        />

        <input
            v-model="draft"
            class="input"
            placeholder="메시지를 입력하세요"
            @keyup.enter="send"
        />

        <input
            ref="imageInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleImageSelected"
        />

        <button class="send" :disabled="!draft.trim()" @click="send">전송</button>
      </div>
    </footer>

    <!-- 파일 전송 확인 모달 -->
    <div
        v-if="pendingFile"
        class="file-confirm-overlay"
        @click.self="cancelPendingFile"
    >
      <div class="file-confirm-modal">
        <div class="file-confirm-title">파일을 보내시겠습니까?</div>

        <div class="file-confirm-card">
          <div class="file-confirm-icon">📎</div>

          <div class="file-confirm-info">
            <div class="file-confirm-name">{{ pendingFile.name }}</div>
            <div class="file-confirm-size">
              {{ formatFileSize(pendingFile.size) }}
            </div>
          </div>
        </div>

        <div v-if="fileError" class="file-confirm-error">
          {{ fileError }}
        </div>

        <div class="file-confirm-help">
          업로드 가능한 파일만 전송할 수 있습니다.
        </div>

        <div class="file-confirm-actions">
          <button
              type="button"
              class="file-confirm-cancel"
              @click="cancelPendingFile"
              :disabled="uploadingFile"
          >
            취소
          </button>

          <button
              type="button"
              class="file-confirm-submit"
              @click="confirmSendFile"
              :disabled="uploadingFile"
          >
            {{ uploadingFile ? '전송 중...' : '확인' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Api from '@/plugins/axios.js';
import { subscribe, sendMessage } from '@/services/ws-client.js';
import emojiRegex from 'emoji-regex';
import DefaultImage from '@/assets/default_image.png';
import { uploadChatImage, uploadChatFile } from '@/assets/js/chat-file.js';

export default {
  name: 'ChatPanel',

  data() {
    return {
      roomTitle: '',
      messages: [],
      draft: '',
      unsub: null,
      readUnsub: null,
      roomId: '',
      loading: false,
      me: null,
      readTimer: null,
      pendingReadMessageId: null,
      pendingVisibleReadMessageId: null,
      lastSentReadMessageId: null,
      defaultImage: DefaultImage,
      showEmojiPicker: false,
      emojiList: ['😀', '😂', '👍', '❤️', '😭', '🎉', '🔥', '🥹'],
      pendingFile: null,
      uploadingFile: false,
      fileError: '',
    };
  },

  async mounted() {
    await this.loadMe();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    await this.loadRoom(this.$route.params.roomId);
  },

  computed: {
    currentRoomId() {
      return this.$route.params.roomId;
    },

    decoratedMessages() {
      return this.messages.map((m, index, arr) => {
        const prev = arr[index - 1];
        const next = arr[index + 1];

        const samePrev = this.isSameVisualGroup(prev, m);
        const sameNext = this.isSameVisualGroup(m, next);

        return {
          ...m,
          groupedTop: samePrev,
          groupedBottom: sameNext,
          showName: !m.mine && !samePrev,
          showAvatar: !m.mine && !sameNext,
          showMeta: !sameNext,
        };
      });
    },
  },

  watch: {
    async currentRoomId(newRoomId, oldRoomId) {
      if (String(newRoomId) === String(oldRoomId)) {
        return;
      }
      await this.loadRoom(newRoomId);
    }
  },

  methods: {
    async loadMe() {
      try {
        const res = await Api.get('/v1/users/me/profile/summary');
        this.me = res?.data ?? res;
      } catch (e) {
        console.error('내 정보 조회 실패', e);
      }
    },

    mapMessage(m) {
      return {
        id: m.id ?? m.messageId,
        type: m.messageType ?? m.type ?? 'TEXT',
        name: m.senderNickname ?? m.sender?.senderNickname ?? '',
        text: m.content ?? m.text ?? '',
        at: m.createdAt ?? m.at ?? new Date().toISOString(),
        mine: m.mine ?? false,
        unreadCount: m.unreadCount ?? 0,
        senderUuid: m.sender?.senderUuid ?? m.senderUserUuid ?? null,
        profileImageUrl:
            m.profileImageUrl ??
            m.sender?.profileImageUrl ??
            this.defaultImage,
      };
    },

    isSameGroup(a, b) {
      if (!a || !b) return false;
      if (a.mine !== b.mine) return false;

      const aSender = a.senderUuid ?? a.name;
      const bSender = b.senderUuid ?? b.name;

      if (aSender !== bSender) return false;

      return this.isSameMinute(a.at, b.at);
    },

    parseFileContent(content) {
      try {
        return JSON.parse(content);
      } catch (e) {
        return null;
      }
    },

    extractFileName(url) {
      if (!url) return '';

      try {
        const clean = String(url).split('?')[0];
        const decoded = decodeURIComponent(clean);
        const name = decoded.substring(decoded.lastIndexOf('/') + 1);
        return name || '';
      } catch (e) {
        return '';
      }
    },

    getFileDisplay(content) {
      const parsed = this.parseFileContent(content);

      if (parsed) {
        return {
          attachmentId: parsed.attachmentId ?? null,
          fileName:
              parsed.fileName ??
              parsed.originalFileName ??
              '파일',
          fileSize: parsed.fileSize ?? null,
        };
      }

      return {
        attachmentId: null,
        fileName: '파일 다운로드',
        fileSize: null,
      };
    },

    isSameVisualGroup(a, b) {
      if (!this.isSameGroup(a, b)) return false;
      return Number(a.unreadCount ?? 0) === Number(b.unreadCount ?? 0);
    },

    isSameMinute(a, b) {
      const da = new Date(a);
      const db = new Date(b);

      if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) {
        return false;
      }

      return Math.abs(da.getTime() - db.getTime()) < 60 * 1000;
    },

    async loadRoom(roomId) {
      if (!roomId) {
        this.roomTitle = '';
        this.messages = [];
        this.roomId = '';
        this.lastSentReadMessageId = null;
        this.cleanupSubscription();
        return;
      }

      const nextRoomId = String(roomId);

      try {
        this.loading = true;
        this.lastSentReadMessageId = null;
        this.pendingReadMessageId = null;
        this.pendingVisibleReadMessageId = null;

        const res = await Api.get(`/v1/chat-room/${nextRoomId}/enter`);
        const data = res;

        if (String(this.currentRoomId) !== nextRoomId) {
          return;
        }

        this.cleanupSubscription();

        this.roomId = nextRoomId;
        this.roomTitle = data?.title ?? '채팅방';
        this.messages = (data?.messages ?? []).map(this.mapMessage);

        await this.$nextTick();
        this.scrollToBottom();

        this.unsub = await subscribe(
            `/user/api/sub/chat/rooms/${nextRoomId}`,
            (msg) => {
              if (String(this.roomId) !== nextRoomId) return;

              const messageId = msg.messageId ?? Date.now();
              if (this.messages.some(m => String(m.id) === String(messageId))) {
                return;
              }

              const mine = msg.sender?.mine ?? msg.mine ?? false;

              this.messages.push({
                id: messageId,
                type: msg.messageType ?? 'TEXT',
                name: msg.sender?.senderNickname ?? '',
                text: msg.content ?? msg.text ?? '',
                at: msg.createdAt ?? new Date().toISOString(),
                mine,
                unreadCount: msg.unreadCount ?? 0,
                senderUuid: msg.sender?.senderUuid,
                profileImageUrl: msg.sender?.profileImageUrl ?? this.defaultImage,
              });

              this.$nextTick(() => this.scrollToBottom());

              if (mine) return;

              if (document.visibilityState !== 'visible') {
                this.pendingVisibleReadMessageId = messageId;
                return;
              }

              this.sendReadDebounced(nextRoomId, messageId);
            },
            { key: 'chat-room-message', replace: true }
        );

        this.readUnsub = await subscribe(
            `/user/api/sub/chat/rooms/${nextRoomId}/read`,
            (event) => {
              if (String(this.roomId) !== nextRoomId) return;
              this.applyReadUpdated(event);
            },
            { key: 'chat-room-read', replace: true }
        );
      } catch (e) {
        console.error('채팅방 로드 실패', e);
      } finally {
        this.loading = false;
      }
    },

    toggleEmojiPicker() {
      this.showEmojiPicker = !this.showEmojiPicker;
    },

    pickEmoji(emoji) {
      if (!emoji) return;

      this.draft += emoji;
      this.showEmojiPicker = false;

      this.$nextTick(() => {
        const input = this.$el.querySelector('.input');
        input?.focus();
      });
    },

    send() {
      const text = this.draft.trim();
      if (!text || !this.roomId) return;

      const messageType = this.isEmojiOnlyMessage(text) ? 'EMOJI' : 'TEXT';

      sendMessage('/api/pub/chat/message', {
        roomId: Number(this.roomId),
        messageType,
        messageContent: text,
      });

      this.draft = '';
      this.showEmojiPicker = false;
      this.$nextTick(() => this.scrollToBottom());
    },

    isEmojiOnlyMessage(text) {
      const normalized = text.trim();
      if (!normalized) return false;

      const noSpaces = normalized.replace(/\s/g, '');
      const regex = emojiRegex();

      const matches = noSpaces.match(regex);
      return !!matches && matches.join('') === noSpaces;
    },

    sendReadDebounced(roomId, messageId) {
      if (!messageId) return;

      if (
          this.lastSentReadMessageId != null &&
          Number(messageId) <= Number(this.lastSentReadMessageId)
      ) {
        return;
      }

      this.pendingReadMessageId = messageId;

      if (this.readTimer) {
        clearTimeout(this.readTimer);
      }

      this.readTimer = setTimeout(() => {
        const targetMessageId = this.pendingReadMessageId;

        if (!targetMessageId) {
          this.readTimer = null;
          return;
        }

        if (
            this.lastSentReadMessageId != null &&
            Number(targetMessageId) <= Number(this.lastSentReadMessageId)
        ) {
          this.readTimer = null;
          return;
        }

        sendMessage('/api/pub/chat/read', {
          roomId: Number(roomId),
          messageId: targetMessageId,
        });

        this.lastSentReadMessageId = targetMessageId;
        this.readTimer = null;
      }, 200);
    },

    applyReadUpdated(event) {
      const updatedMap = new Map(
          (event.updatedMessages ?? []).map((m) => [
            String(m.messageId),
            m.unreadCount,
          ])
      );

      this.messages = this.messages.map((m) => {
        const unreadCount = updatedMap.get(String(m.id));
        if (unreadCount == null) {
          return m;
        }

        return {
          ...m,
          unreadCount,
        };
      });
    },

    handleVisibilityChange() {
      if (document.visibilityState !== 'visible') {
        return;
      }

      if (!this.pendingVisibleReadMessageId || !this.roomId) {
        return;
      }

      this.sendReadDebounced(this.roomId, this.pendingVisibleReadMessageId);
      this.pendingVisibleReadMessageId = null;
    },

    cleanupSubscription() {
      if (this.unsub) {
        if (typeof this.unsub === 'function') {
          this.unsub();
        } else if (typeof this.unsub.unsubscribe === 'function') {
          this.unsub.unsubscribe();
        }
        this.unsub = null;
      }

      if (this.readUnsub) {
        if (typeof this.readUnsub === 'function') {
          this.readUnsub();
        } else if (typeof this.readUnsub.unsubscribe === 'function') {
          this.readUnsub.unsubscribe();
        }
        this.readUnsub = null;
      }
    },

    openImagePicker() {
      this.$refs.imageInput?.click();
    },

    async handleImageSelected(event) {
      const file = event.target.files?.[0];
      if (!file || !this.roomId) return;

      try {
        const uploaded = await uploadChatImage(file);

        sendMessage('/api/pub/chat/message', {
          roomId: Number(this.roomId),
          messageType: 'IMAGE',
          messageContent: uploaded.fileUrl ?? uploaded.url,
        });
      } catch (e) {
        console.error('채팅 이미지 업로드 실패', e);
      } finally {
        if (this.$refs.imageInput) {
          this.$refs.imageInput.value = '';
        }
      }
    },

    openFilePicker() {
      this.$refs.fileInput?.click();
    },

    handleFileSelected(event) {
      const file = event.target.files?.[0];

      if (!file || !this.roomId) return;

      this.fileError = '';
      this.pendingFile = file;

      if (event.target) {
        event.target.value = '';
      }
    },

    async confirmSendFile() {
      if (!this.pendingFile || !this.roomId || this.uploadingFile) return;
      if (!this.validatePendingFile()) {
        return;
      }

      try {
        this.uploadingFile = true;
        this.fileError = '';

        const uploaded = await uploadChatFile(this.pendingFile, Number(this.roomId));

        const filePayload = {
          attachmentId: uploaded.attachmentId,
          fileName: uploaded.fileName ?? this.pendingFile.name,
          contentType: uploaded.contentType ?? this.pendingFile.type,
          fileSize: uploaded.fileSize ?? this.pendingFile.size,
        };

        console.log("file payload: ", filePayload);

        sendMessage('/api/pub/chat/message', {
          roomId: Number(this.roomId),
          messageType: 'FILE',
          messageContent: JSON.stringify(filePayload),
        });

        this.pendingFile = null;
        this.fileError = '';
      } catch (e) {
        console.error('파일 전송 실패', e);
        this.fileError = this.resolveFileErrorMessage(e);
      } finally {
        this.uploadingFile = false;
      }
    },
    getFileDownloadUrl(content) {
    const parsed = this.parseFileContent(content);

    if (!parsed?.attachmentId) {
      return '#';
    }

    return `/api/v1/chat-attachments/${parsed.attachmentId}/download`;
    },
    cancelPendingFile() {
      if (this.uploadingFile) return;
      this.pendingFile = null;
      this.fileError = '';
    },

    formatFileSize(size) {
      if (size == null || Number.isNaN(Number(size))) return '';

      const bytes = Number(size);
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    },

    scrollToBottom() {
      const el = this.$refs.list;
      if (!el) return;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight;
        });
      });
    },

    format(iso) {
      const d = new Date(iso);
      return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
    },
    resolveFileErrorMessage(error) {
      console.log('error: ', error);
      const code = error?.code;
      const status = error?.status;

      if (code === 'FILE_SIZE_EXCEEDED' || status === 413) {
        return '파일 크기가 제한을 초과했습니다.';
      }

      if (code === 'INVALID_FILE_UPLOAD') {
        return '파일 업로드 요청이 올바르지 않습니다.';
      }


      return error?.message || '파일 전송에 실패했습니다.';
    },
    validatePendingFile() {
      if (!this.pendingFile) return false;

      const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
      if (this.pendingFile.size > MAX_FILE_SIZE) {
        this.fileError = '파일 크기가 제한을 초과했습니다.';
        return false;
      }

      return true;
    },
  },

  beforeUnmount() {
    this.cleanupSubscription();

    if (this.readTimer) {
      clearTimeout(this.readTimer);
      this.readTimer = null;
    }

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  },
};
</script>

<style scoped>
.panel {
  position: relative;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: hidden;
  min-height: 0;
}

.header {
  height: 52px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid #e9ecef;
}

.title {
  font-weight: 600;
}

.icon {
  background: transparent;
  border: none;
  cursor: pointer;
}

.messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
  background: #f7f7f8;
  overscroll-behavior: contain;
}

.empty {
  color: #868e96;
  padding: 20px;
  text-align: center;
}

.msg {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin: 10px 0;
}

.msg.compact {
  margin-top: 2px;
}

.msg.mine {
  justify-content: flex-end;
}

.avatar-slot {
  width: 34px;
  flex-shrink: 0;
}

.avatar {
  width: 34px;
  height: 34px;
}

.avatar img {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

.msg-body {
  display: flex;
  flex-direction: column;
  max-width: 65%;
}

.msg-body.mine {
  align-items: flex-end;
}

.name {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  padding-left: 2px;
}

.message-row {
  display: flex;
  align-items: flex-end;
  gap: 6px;
}

.message-row.mine {
  justify-content: flex-end;
}

.bubble {
  max-width: 260px;
  padding: 10px 12px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.bubble.mine {
  background: #4dabf7;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.bubble:not(.mine) {
  border-bottom-left-radius: 4px;
}

.bubble.groupedTop:not(.mine) {
  border-top-left-radius: 6px;
}

.bubble.groupedBottom:not(.mine) {
  border-bottom-left-radius: 6px;
}

.bubble.mine.groupedTop {
  border-top-right-radius: 6px;
}

.bubble.mine.groupedBottom {
  border-bottom-right-radius: 6px;
}

.text {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.4;
}

.meta {
  font-size: 11px;
  color: #868e96;
  white-space: nowrap;
}

.composer-wrap {
  flex-shrink: 0;
  border-top: 1px solid #e9ecef;
  background: #fff;
}

.composer {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  padding: 10px;
  background: #fff;
}

.input {
  flex: 1;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 8px 10px;
}

.send {
  border: none;
  border-radius: 8px;
  padding: 0 14px;
  background: #4dabf7;
  color: #fff;
  cursor: pointer;
}

.send:disabled {
  opacity: 0.6;
  cursor: default;
}

.unread-mark {
  font-size: 12px;
  color: #f03e3e;
  font-weight: 600;
  white-space: nowrap;
}

.unread-mark.left {
  margin-right: 4px;
}

.unread-mark.right {
  margin-left: 4px;
}

.unread-pop-enter-active {
  animation: pop 0.2s ease;
}

.unread-pop-leave-active {
  transition: all 0.18s ease;
}

.unread-pop-leave-to {
  opacity: 0;
  transform: scale(0.6);
}

@keyframes pop {
  0% {
    transform: scale(0.7);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}

.emoji-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid #f1f3f5;
  background: #fff;
}

.emoji-btn {
  border: none;
  background: transparent;
  font-size: 24px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 8px;
}

.emoji-btn:hover {
  background: #f1f3f5;
}

.emoji-toggle,
.image-toggle,
.file-toggle {
  border: none;
  border-radius: 8px;
  padding: 0 10px;
  background: #f1f3f5;
  cursor: pointer;
  font-size: 18px;
}

.emoji-text {
  font-size: 32px;
  line-height: 1.2;
  white-space: pre-wrap;
}

.chat-image {
  display: block;
  max-width: 220px;
  max-height: 280px;
  border-radius: 12px;
  object-fit: cover;
  cursor: pointer;
}

.file-message {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-link {
  color: inherit;
  text-decoration: none;
  font-weight: 600;
  word-break: break-all;
}

.file-size {
  font-size: 12px;
  opacity: 0.7;
}

.file-confirm-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
}

.file-confirm-modal {
  width: 320px;
  max-width: calc(100% - 32px);
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
  padding: 18px 16px 14px;
}

.file-confirm-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 14px;
  color: #212529;
}

.file-confirm-card {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  background: #f8f9fa;
  margin-bottom: 14px;
}

.file-confirm-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #e7f5ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.file-confirm-info {
  min-width: 0;
  flex: 1;
}

.file-confirm-name {
  font-size: 14px;
  font-weight: 600;
  color: #212529;
  word-break: break-all;
}

.file-confirm-size {
  margin-top: 4px;
  font-size: 12px;
  color: #868e96;
}

.file-confirm-error {
  font-size: 13px;
  color: #e03131;
  margin-bottom: 10px;
}

.file-confirm-help {
  font-size: 12px;
  color: #868e96;
  margin-bottom: 12px;
}

.file-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.file-confirm-cancel,
.file-confirm-submit {
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 600;
}

.file-confirm-cancel {
  background: #f1f3f5;
  color: #495057;
}

.file-confirm-submit {
  background: #4dabf7;
  color: #fff;
}

.file-confirm-cancel:disabled,
.file-confirm-submit:disabled {
  opacity: 0.6;
  cursor: default;
}

.error-text {
  color: #e03131;
  font-size: 13px;
  padding: 8px 12px;
}
</style>