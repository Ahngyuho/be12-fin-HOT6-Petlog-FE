// stores/chat.js
import { defineStore } from "pinia";
import axios from "axios";
import SockJS from "sockjs-client";
import { Client as StompClient } from "@stomp/stompjs";
import { io } from "socket.io-client";

export const useChatStore = defineStore("chat", {
  state: () => ({
    selectedRoom: null,
    chatRooms: [],
    unreadCount: 0,
    chatRoomInfo: {},
    chatRoomUsers: [],
    chatRoomScheduleList: [],
    userPets: [],
    ChatRoomScheculeDetail: [],
    myInfo: {},
    messages: [],
    stompClient: null,
    currentUserId: 2,
    myChatRooms: [],
    hasNext: true,
    lastUserId: null,
    isParticipating: false,
    socketClient: null,
  }),

  actions: {
    async enterChatRoom(roomId) {
      // ✅ 1. 초기 메시지 로딩
      await this.loadMessages(roomId);

      // ✅ 2. WebSocket 연결 및 실시간 구독
      // this.connectStomp(roomId, () => {
      //   console.log("📡 실시간 구독 시작!");
      // });

      this.connectSocketIO(roomId, () => {
        console.log("📡 실시간 구독 시작!");
      });
    },

    bindSocketEvents() {
    if (!this.socketClient) return;

    this.socketClient.off("chat-message");
    this.socketClient.on("chat-message", (msg) => {
      this.messages.push(msg);
    });

    this.socketClient.off("disconnect");
    this.socketClient.on("disconnect", (reason) => {
      console.log("연결 종료:", reason);
    });
  },

    async leaveChatRoom(roomIdx) {
      await axios.delete(`/api/chat/chatroom/${roomIdx}/leave`);
    },

    async loadMessages(roomId, lastMessageId = null) {
      try {
        const res = await axios.get(`/api/chat/chatroom/${roomId}/chat`, {
          params: lastMessageId ? { lastMessageId } : {},
        });

        const newMessages = res.data.result.content;

        if (lastMessageId) {
          // 스크롤 업: 기존 메시지 앞에 추가
          this.messages = [...newMessages, ...this.messages];
        } else {
          // 최초 로딩: 새로 세팅
          this.messages = newMessages;
        }

        // 📌 필요시 hasNext 여부도 저장해서 무한스크롤 종료 판단 가능
        this.hasMoreMessages = newMessages.length > 0;
      } catch (e) {
        console.error("❌ 메시지 로딩 실패:", e);
      }
    },

connectSocketIO(roomId, onConnectedCallback) {
  const socket = io("ws://localhost:3000", {
    reconnectionDelayMax: 10000,
    auth: {
      token: "123",
    },
    query: {
      "my-key": "my-value",
    },
  });

  this.socketClient = socket;

  this.bindSocketEvents();


  socket.on("connect", () => {
    console.log("연결 성공");
    socket.emit("join-room", { roomId });
  });

  socket.on("connect_error", (err) => {
    console.error("연결 실패:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("연결 종료:", reason);
  });
},
    connectStomp(roomId, onConnectedCallback) {
      const socket = new SockJS("/api/ws");

      this.stompClient = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,

        onConnect: () => {
          console.log("✅ STOMP 연결 성공");

          // 채팅방 구독
          this.stompClient.subscribe(`/topic/chat/${roomId}`, (message) => {
            const msg = JSON.parse(message.body);
            // console.log(msg);
            this.receiveMessage(msg);
          });

          if (onConnectedCallback) onConnectedCallback();
        },

        onStompError: (frame) => {
          console.error("❌ STOMP 오류 발생:", frame);
        },
      });

      this.stompClient.activate(); // 연결 시작
    },

    sendMessage(message, roomId, type) {
      const msg = {
    roomId,
    content: {
      type,
      ...message,
    },
    timestamp: new Date().toISOString(),
  };

  if (!this.socketClient || !this.socketClient.connected) {
    console.warn("⛔ Socket.IO 연결되지 않음");
    return;
  }

  this.socketClient.emit("chat-message", msg, (ack) => {
    console.log("서버 ack:", ack);
  });

      // if (this.stompClient && this.stompClient.connected) {
      //   this.stompClient.publish({
      //     destination: `/app/chat/${roomId}`,
      //     body: JSON.stringify(msg),
      //   });
      // } else {
      //   console.warn("⛔ STOMP 연결되지 않음 (테스트 메시지 추가)");
      //   this.messages.push({ ...msg, testMode: true });
      // }
    },

    sendMessageToSocket(message, roomId, type) {
      const msg = {
        chatroomId: roomId,
        content: {
          type: type,
          ...message,
        },
        timestamp: new Date().toISOString(),
      };

      if (this.stompClient && this.stompClient.connected) {
        this.stompClient.publish({
          destination: `/app/chat/${roomId}`,
          body: JSON.stringify(msg),
        });
      } else {
        console.warn("⛔ STOMP 연결되지 않음 (테스트 메시지 추가)");
        this.messages.push({ ...msg, testMode: true });
      }
    },
    async submitScheduleParticipation(chatroomIdx, scheduleIdx, animalIds) {
      try {
        const response = await axios.post(
          `/api/chat/chatroom/${chatroomIdx}/schedule/${scheduleIdx}`,
          {
            animalIds: animalIds,
          }
        );
        // console.log("참여 완료:", response.data.result);
        // 필요하면 상태 업데이트
      } catch (error) {
        console.error("참여 실패:", error);
        throw error; // 에러를 밖으로 던져서 UI에서 처리하게
      }
    },

    async loadRooms() {
      try {
        const response = await axios.get(`/api/chat/`);
        this.chatRooms = response.data.result.content;
      } catch (error) {
        console.error("채팅방 목록 불러오기 실패:", error);
      }
    },

    async loadMyChatRooms() {
      try {
        const response = await axios.get(`/api/chat/chatrooms/me`);
        this.chatRooms = response.data.result.content;
      } catch (error) {
        throw error;
      }
    },
    async searchRooms({ keyword, tags }) {
      try {
        // console.log(tags);
        console.log("🚀 axios.get 호출 시작");
        const response = await axios.get("/api/chat/search", {
          params: {
            query: keyword || null,
            hashtags: tags.length > 0 ? tags : null,
          },
          paramsSerializer: (params) => {
            try {
              const query = new URLSearchParams();

              // 💥 query 조건 안전 처리
              if (typeof params.query === "string" && params.query.trim()) {
                query.append("query", params.query.trim());
              }

              // 💥 hashtags 조건 안전 처리
              if (Array.isArray(params.hashtags)) {
                params.hashtags
                  .filter((tag) => typeof tag === "string" && tag.trim() !== "")
                  .forEach((tag) => query.append("hashtags", tag.trim()));
              }

              const finalQuery = query.toString();
              console.log("✅ 직렬화된 쿼리:", finalQuery);
              return finalQuery;
            } catch (e) {
              console.error("❌ paramsSerializer에서 예외 발생!", e);
              return "";
            }
          },
        });
        // console.log("✅ axios 응답:", response);
        this.chatRooms = response.data.result;
        // console.log(this.chatRooms);
      } catch (error) {
        console.error("❌ 채팅방 검색 실패", error);
      }
    },
    async getRoomInfo(chatroomIdx) {
      try {
        const response = await axios.get(`/api/chat/chatroom/${chatroomIdx}`);

        this.chatRoomInfo = response.data.result;
        console.log(this.chatRoomInfo);
      } catch (error) {
        console.error("채팅방 정보 불러오기 실패:", error);
      }
    },

    async fetchUsers(chatRoomId) {
      if (!this.hasNext) return;

      const res = await axios.get(`/api/chat/chatroom/${chatRoomId}/users`, {
        params: {
          lastUserId: this.lastUserId,
          size: 20,
        },
      });

      const { content, hasNext } = res.data.result;
      this.chatRoomUsers.push(...content);
      this.hasNext = hasNext;
      if (content.length > 0) {
        this.lastUserId = content[content.length - 1].idx;
      }
    },

    resetUsers() {
      this.chatRoomUsers = [];
      this.hasNext = true;
      this.lastUserId = null;
    },

    async getChatRoomScheduleList(roomIdx) {
      try {
        const response = await axios.get(
          `/api/chat/chatroom/${roomIdx}/schedule`
        );
        this.chatRoomScheduleList = response.data.result;
      } catch (err) {
        console.error("❌ 멤버 목록 불러오기 실패:", err);
      }
    },

    async getUserPets() {
      try {
        const response = await axios.get("/api/pet/user");

        this.userPets = response.data.result;
      } catch (err) {
        console.error("실패");
      }
    },

    async getChatroomScheduleDetail(roomIdx, scheduleIdx) {
      try {
        const response = await axios.get(
          `/api/chat/chatroom/${roomIdx}/schedule/${scheduleIdx}`
        );

        this.ChatRoomScheculeDetail = response.data.result;
        this.isParticipating = this.ChatRoomScheculeDetail.participating;
        // console.log(this.ChatRoomScheculeDetail);
      } catch (err) {
        console.error(err);
      }
    },

    async getMyInfo() {
      try {
        const response = {
          data: {
            userId: 100,
            username: "petlover123",
            nickname: "짱봄맘",
            profileUrl: "...",
            roles: ["USER"],
          },
        };

        this.myInfo = response.data;
        // console.log(this.myInfo);
      } catch (err) {}
    },

    receiveMessage(msg) {
      this.messages.push(msg);
    },

    resetUnread() {
      this.unreadCount = 0;
    },

    async createChatRoom(title, tags) {
      const hashtags = tags
        .split("#")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "");

      const payload = {
        title: title,
        hashtags: hashtags,
      };

      await axios.post("/api/chat", payload);
    },

    async updateRoom(title, tags, roomIdx) {
      try {
        const response = await axios.put(`/api/chat/${roomIdx}`, {
          title: title,
          hashtags: tags, // 예: ["햄스터", "정보"]
        });
      } catch (error) {
        console.error("채팅방 수정 실패:", error);
      }
    },

    async createChatRoomSchedule(chatroomIdx, requestBody) {
      this.errorMessage = "";
      try {
        await axios.post(
          `/api/chat/chatroom/${chatroomIdx}/schedule`,
          requestBody
        );
      } catch (err) {
        console.error(err);
        this.errorMessage = "일정 저장에 실패했습니다.";
        throw err; // ❗ 컴포넌트 쪽에서도 catch 할 수 있게 throw
      }
    },
  },
});
