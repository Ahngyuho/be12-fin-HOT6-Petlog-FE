<template>
  <div class="chat-page">
    <div class="chat-content-wrapper">
      <div class="chat">채팅</div>
      <div class="chat-toolbar">
        <div class="search-area">
          <!-- 검색창 -->
          <div class="search-input-wrapper">
            <input
              class="search-box"
              v-model="searchInput"
              @keydown.enter="onSearchInput"
              placeholder="제목이나 #해시태그로 검색해보세요"
            />
            <img src="/src/assets/icons/search.svg" alt="search" />
          </div>
          <div class="selected-tags-wrapper" v-if="selectedTags.length">
            <span class="selected-tag" v-for="tag in selectedTags" :key="tag">
              #{{ tag }}
              <button class="remove-tag" @click="removeTag(tag)">×</button>
            </span>
          </div>
        </div>
        <!-- 상단 버튼들 -->
        <div class="chat-header-actions">
          <button
            class="chat-button"
            :class="{ 'chat-button--select': !isMyRoomView }"
            @click="showAllRooms"
          >
            그룹 채팅방
          </button>
          <button
            class="chat-button"
            :class="{ 'chat-button--select': isMyRoomView }"
            @click="showMyRooms"
          >
            내 채팅방
          </button>
          <button class="chat-button--create" @click="openModal">
            <img src="/src/assets/icons/chat_plus.svg" alt="채팅방 생성" />
          </button>
        </div>
      </div>
      <!-- 채팅 목록 -->
      <div class="chat-list">
        <ChatCard v-for="room in chatStore.chatRooms" :key="room.idx" :room="room" />
        <ChatCard :key="1" :room="testRoom" />
      </div>
    </div>
  </div>

  <!-- 채팅방 생성 모달 -->
  <div v-if="showModal" class="modal-overlay">
    <div class="create-chat-modal">
      <div class="modal-header">
        <h2>새 그룹 채팅방 만들기</h2>
        <button class="close-button" @click="closeModal">×</button>
      </div>

      <div class="modal-content">
        <label class="modal-label">채팅방 이름</label>
        <input
          type="text"
          class="modal-input"
          v-model="roomName"
          placeholder="채팅방 이름을 입력해주세요."
        />

        <label class="modal-label">해시태그</label>
        <textarea
          class="modal-textarea"
          v-model="roomTags"
          placeholder="앞에 #를 붙여 해시태그를 입력해주세요.&#10;ex) #산책 #강아지 #소통"
        ></textarea>
      </div>

      <div class="modal-actions">
        <button class="cancel-button" @click="closeModal">취소</button>
        <button class="confirm-button" @click="createRoom">완료</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useChatStore } from "../../stores/useChatStore.js";
import ChatCard from "./components/ChatCard.vue";
import { handleChatRoomError } from "../../utils/errorHandler";
import { useRouter } from "vue-router";

//
const testRoom = {
  idx: 999999,
  title: "테스트 채팅방",
  hashtags: ["#테스트", "#임시방"],
  participants: 1,
  maxParticipants: 10,
  isParticipating: true,
  startDateTime: "2026-04-11T15:00:00",
};


const router = useRouter();
const chatStore = useChatStore();
const showModal = ref(false); // true일 경우 모달이 보임
const roomName = ref("");
const roomTags = ref("");
const isMyRoomView = ref(false); // false면 전체방, true면 내 채팅방
const showAllRooms = async () => {
  await chatStore.loadRooms();
  isMyRoomView.value = false;
};

const searchInput = ref("");
const selectedTags = ref([]);

// 사용자가 입력한 값에서 #태그를 추출해서 selectedTags에 추가
const onSearchInput = () => {
  const tagMatches = searchInput.value.match(/#(\S+)/g) || [];
  selectedTags.value = [...new Set(tagMatches.map((tag) => tag.replace("#", "")))];
  const keywordOnly = searchInput.value.replace(/#\S+/g, "").trim();
  if (keywordOnly.length > 0 || selectedTags.value.length > 0) {
    chatStore.searchRooms({
      keyword: keywordOnly,
      tags: selectedTags.value,
    });
  } else {
    // ✅ 조건이 없으면 기존 전체 채팅방 불러오기
    chatStore.loadRooms();
  }
};

const removeTag = (tagToRemove) => {
  selectedTags.value = selectedTags.value.filter((tag) => tag !== tagToRemove);
  onSearchInput(); // 태그 제거 후 검색 갱신
};

const showMyRooms = async () => {
  try {
    await chatStore.loadMyChatRooms();
    isMyRoomView.value = true;
  } catch (error) {
    handleChatRoomError(error, router);
  }
};
const closeModal = () => {
  showModal.value = false;
  roomName.value = "";
  roomTags.value = "";
};

const createRoom = async () => {
  await chatStore.createChatRoom(roomName.value, roomTags.value);
  await chatStore.loadRooms(); // 🔁 목록 새로 불러오기
  closeModal();
};

const openModal = () => {
  showModal.value = true;
};

onMounted(() => {
  chatStore.loadRooms(); // 테스트 데이터 로딩
});
</script>

<style>
.chat-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start; /* ✅ 버튼들이 위에 고정되도록 설정 */
}
.chat {
  color: #000;
  font-family: Inter;
  font-size: 32px;
  font-style: normal;
  font-weight: 700;
  line-height: 140%; /* 44.8px */
}
.chat-page {
  display: flex;
  justify-content: center;
  margin: 40px 25%;
  min-width: 500px;
}

.chat-content-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chat-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
}

.chat-button {
  padding: 10px 14px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  background: white;
  box-shadow: 2px 2px 2px 0px rgba(0, 0, 0, 0.25);
}

.chat-button--select {
  background-color: #6a0104;
  color: white;
}

.chat-button--create > img {
  width: 30px;
  height: 30px;
  margin-top: 2px;
  transition: scale 0.3s;
}

.chat-button--create > img:hover {
  scale: 1.1;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--gray200);
  border-radius: 30px;
  padding: 10px 16px;
}

.search-box {
  width: 100%;
  font-size: 14px;
  outline: none;
  margin-right: 10px;
}

/* ✅ 검색창 + 태그 전체 묶는 영역 */
.search-area {
  width: 350px;
  min-width: 250px;
}

.selected-tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0; /* 기존 margin 제거 */
}

.selected-tag {
  background-color: #ffd966;
  color: #333;
  border-radius: 16px;
  padding: 4px 10px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.remove-tag {
  background: none;
  border: none;
  font-weight: bold;
  cursor: pointer;
}
.selected-tag button {
  margin-left: 6px;
  background: none;
  border: none;
  font-weight: bold;
  cursor: pointer;
}
.chat-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

/* 모달 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* 모달 박스 */
.create-chat-modal {
  width: 500px;
  background: white;
  border-radius: 16px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  border: 1px solid #ccc;
}

/* 헤더 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ddd;
  padding-bottom: 12px;
}

.modal-header h2 {
  font-size: 18px;
  font-weight: bold;
  color: #000;
}

.close-button {
  all: unset;
  font-size: 20px;
  cursor: pointer;
}

/* 입력영역 */
.modal-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-label {
  margin-bottom: 8px; /* label과 input 사이 */
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.modal-input,
.modal-textarea {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
}

.modal-textarea {
  height: 80px;
  resize: none;
}

/* 하단 버튼 */
.modal-actions {
  display: flex;
  justify-content: center;

  gap: 12px;
}

.cancel-button,
.confirm-button {
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 12px;
  cursor: pointer;
  border: none;
}

.cancel-button {
  background: #f5f5f5;
  color: #555;
}

.confirm-button {
  background: #6a0104;
  color: white;
}
</style>
