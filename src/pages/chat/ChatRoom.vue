<template>
  <div class="chatroom-container">
    <div class="chatroom">
      <!-- 채팅방 헤더 -->
      <ChatHeader :title="roomTitle" :showMenu="true" :roomIdx="chatroomIdx" />

      <ChatMessages
        :messages="chatStore.messages"
        :currentUserId="currentUserId"
        @load-previous="loadPreviousMessages"
      />

      <!-- 입력 영역 -->
      <ChatInput @open-pet-modal="isModalOpen = true" />
    </div>
  </div>

  <!-- Pet 선택 모달 -->
  <div v-if="isModalOpen" class="modal-overlay" @click.self="isModalOpen = false">
    <div class="modal-content">
      <h3>반려동물 목록</h3>

      <div class="scrollable pet-list-scroll">
        <div
          v-for="pet in chatStore.userPets"
          :key="pet.idx"
          class="pet-card"
          @click="sendPetMessage(pet)"
        >
          <img :src="pet.imageUrl || defaultPetImage" class="pet-img" />
          <div class="pet-info">
            <div class="pet-name">{{ pet.petName }}</div>
            <div class="pet-detail">{{ pet.breed }}</div>
          </div>
        </div>
      </div>

      <button class="modal-close" @click="isModalOpen = false">닫기</button>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import ChatHeader from "./ChatHeader.vue";
import { useChatStore } from "../../stores/useChatStore.js";
import { useUserStore } from "../../stores/useUserStore";
import ChatMessages from "./components/ChatMessages.vue";
import ChatInput from "./components/ChatInput.vue";
const chatStore = useChatStore();
const userStore = useUserStore();
const route = useRoute();
const chatroomIdx = route.params.chatroomIdx;

const currentUserId = userStore.idx; // 실제론 로그인된 유저 ID
const sendPetMessage = (pet) => {
  try {
    chatStore.sendMessage(
      {
        idx: pet.idx,
        name: pet.petName,
        breed: pet.breed,
        gender: pet.gender,
        age: pet.age,
        image: pet.imageUrl,
      },
      chatroomIdx, // 혹은 현재 채팅방 ID
      "pet"
    );

    isModalOpen.value = false;
  } catch (e) {
    alert("반려동물 카드 전송에 실패했습니다.");
  }
};
const loadPreviousMessages = async () => {
  const oldestId = chatStore.messages[0]?.idx;
  await chatStore.loadMessages(chatroomIdx, oldestId);
};
onMounted(() => {
  console.log(currentUserId);
  // chatStore.getRoomInfo(chatroomIdx);
  // chatStore.connectStomp(chatroomIdx, () => {
  //   console.log("🟢 연결된 후 실행할 추가 작업!");
  // });
  chatStore.connectSocketIO(chatroomIdx);
  // chatStore.loadMessages(chatroomIdx);
  // chatStore.getUserPets();
});

const isModalOpen = ref(false);

const roomTitle = computed(() => chatStore.chatRoomInfo?.title || "채팅방");
</script>
<style scoped>
@import "./chat-base.css";
/* 전체 페이지 영역 */
.chatroom-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 16px;
  background-color: #f9f9f9;
}

/* 채팅방 뒤로가기 */
.chatroom-back {
  width: 100%;
  max-width: 720px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  justify-content: flex-start;
}

.chatroom-back span {
  font-size: 16px;
  font-family: Inter;
}

/* 채팅 박스 전체 */
.chatroom {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 720px;
  /* max-width: 100%; */
  height: 100%;
  max-height: 720px;
  border-radius: 20px;
  background-color: var(--bg-chatroom, #f4eee7);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* 헤더 */
.chatroom-header {
  position: relative;
  text-align: center;
  padding: 16px;
  font-weight: bold;
  font-size: 18px;
  border-bottom: 1px solid #ddd;
}

.chatroom-menu {
  all: unset;
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}

/* ✅ 채팅방 내 반려동물 카드 메시지 */
.pet-message {
  display: flex;
  gap: 8px;
}

/* ✅ 일정 카드 메시지 공통 */
.schedule-message {
  display: flex;
  gap: 8px;
}

/* ✅ 카드 스타일 */
.schedule-chat-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  width: 30%; /* ✅ 너비 통일 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #ccc;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: Inter;
}

.schedule-title {
  color: #000;

  font-family: Inter;
  font-size: 16px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
}

.schedule-datetime {
  color: var(--gray700, #616161);
  font-family: Inter;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
}

.schedule-location {
  color: #000;
  font-family: Inter;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
}

.modal-content {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  width: 360px;
  max-height: 80vh; /* ✅ 최대 높이 제한 */
  display: flex;
  flex-direction: column;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* ✅ 스크롤 가능한 영역 */
.pet-list-scroll {
  overflow-y: auto;
  max-height: 300px;
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 16px; /* ✅ 스크롤바와 카드 간 여백 추가 */
}

/* ✅ 펫 카드 */
.pet-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 12px;
  background-color: #fdfdfd;
}

.pet-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.pet-info {
  text-align: left;
}

.pet-name {
  font-weight: bold;
  font-size: 14px;
}
.pet-detail {
  font-size: 12px;
  color: #666;
}

/* 닫기 버튼 */
.modal-close {
  padding: 10px;
  background: #6a0104;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.pet-card:hover {
  background-color: #f0f0f0; /* 밝은 회색으로 변경 */
  cursor: pointer; /* 마우스 포인터 변경 */
}
</style>
