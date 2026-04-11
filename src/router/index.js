import { createRouter, createWebHistory } from "vue-router";
import HomePage from "../pages/common/HomePage.vue";

import Chat from "../pages/chat/Chat.vue";
import ChatRoom from "../pages/chat/ChatRoom.vue";
import ChatRoomInfo from "../pages/chat/ChatRoomInfo.vue";
import ChatRoomSchecule from "../pages/chat/ChatRoomSchecule.vue";
import ChatRoomScheculeCreate from "../pages/chat/ChatRoomScheduleCreate2.vue";
import Schedule from "../pages/schedule/Schedule.vue";

import Mypage from "../pages/mypage/Mypage.vue";
import MypageProfile from "../pages/mypage/MypageProfile.vue";
import MypageCardList from "../pages/mypage/MypageCardList.vue";
import MypageCardCreate from "../pages/mypage/MypageCardCreate.vue";
import MypageQuestion from "../pages/mypage/MypageQuestion.vue";
import MypageAnswer from "../pages/mypage/MypageAnswer.vue";
import MypagePost from "../pages/mypage/MypagePost.vue";
import MypageComment from "../pages/mypage/MypageComment.vue";

import FreeBoard from "../pages/board/FreeBoard.vue";
import InformationBoard from "../pages/board/InformationBoard.vue";
import BoardSidebar from "../pages/board/BoardSidebar.vue";
import QnaBoard from "../pages/board/QnaBoard.vue";
import QuestionDetail from "../pages/board/QuestionDetail.vue";
import PostCreate from "../pages/board/PostCreate.vue";
import PostDetail from "../pages/board/PostDetail.vue";
import QuestionCreate from "../pages/board/QuestionCreate.vue";
import AnswerCreate from "../pages/board/AnswerCreate.vue";

import Admin from "../pages/admin/Admin.vue";
import AdminProfile from "../pages/admin/AdminProfile.vue";
import AdminCategory from "../pages/admin/AdminCategory.vue";
import AdminEvent from "../pages/admin/AdminEvent.vue";
import ScheduleCategory from "../pages/admin/ScheduleCategory.vue";
import UpdateScheduleCategory from "../pages/admin/ModifyScheduleCategory.vue";
import Record from "../pages/admin/RecordCategory.vue";
import RecordFix from "../pages/admin/ModifyRecordCategory.vue";
import Board from "../pages/admin/BoardCategory.vue";
import BoardFix from "../pages/admin/ModifyBoard.vue";
import BoardTypeCategoryFix from "../pages/admin/ModifyBoardCategory.vue";
import BoardTypeCategory from "../pages/admin/BoardTypeCategory.vue";

import Login from "../pages/user/Login.vue";
import Signup from "../pages/user/Signup.vue";
import PlaceSidebar from "../pages/place/PlaceSidebar.vue";
import Hospital from "../pages/place/SearchHospital.vue";
import Beauty from "../pages/place/SearchBeauty.vue";
import ChatRoomScheduleDetail from "../pages/chat/ChatRoomScheduleDetail.vue";
import UserLayout from "../pages/user/UserLayout.vue";
import DetailList from "../pages/schedule/components/DetailList.vue";
import DetailItem from "../pages/schedule/components/DetailItem.vue";
import DetailRecordItem from "../pages/schedule/components/DetailRecordItem.vue";
import { useUserStore } from "../stores/useUserStore";
import DeletedUser from "../pages/user/DeletedUser.vue";

// admin 체크
const adminOnlyGuard = (to, from, next) => {
  const userStore = useUserStore();

  if (userStore.type === "ADMIN") {
    next();
  } else {
    alert("관리자만 접근 가능한 페이지입니다.");
    next("/");
  }
};

const requireLogin = (to, from, next) => {
  const userStore = useUserStore();
  // if (!userStore.isLogin) {
  //   alert("로그인이 필요한 페이지입니다.");
  //   next("/user/login"); // 로그인 페이지로 리다이렉트
  // } else {
    next(); // 통과
  // }
};

const routes = [
  {
    path: "/",
    component: HomePage,
  },
  { path: "/chat", component: Chat },
  { path: "/chatroom/:chatroomIdx", component: ChatRoom },
  { path: "/chatroom/:chatroomIdx/chatroom-info", component: ChatRoomInfo },
  {
    path: "/chatroom/:chatroomIdx/chatroom-schedule",
    component: ChatRoomSchecule,
  },
  {
    path: "/chatroom/:chatroomIdx/chatroom-schedule/create",
    component: ChatRoomScheculeCreate,
  },
  {
    path: "/chatroom/:chatroomIdx/chatroom-schedule/:scheduleIdx",
    component: ChatRoomScheduleDetail,
  },

  {
    path: "/user",
    component: UserLayout,
    children: [
      { path: "login", component: Login },
      { path: "signup", component: Signup },
      { path: "login/error/deleted", component: DeletedUser },
    ],
  },
  {
    path: "/mypage/card/detail/:petId",
    name: "MypageCardDetail",
    component: () => import("../pages/mypage/MypageCardDetail.vue"),
  },
  {
    path: "/mypage/card/change/:petId",
    name: "MypageCardChange",
    component: () => import("../pages/mypage/ModifyMypageCard.vue"),
  },
  {
    path: "/mypage",
    component: Mypage,
    redirect: "/mypage/profile",
    children: [
      { path: "profile", component: MypageProfile },
      { path: "cardlist", component: MypageCardList },
      { path: "card/create", component: MypageCardCreate },
      { path: "question", component: MypageQuestion },
      { path: "answer", component: MypageAnswer },
      { path: "post", component: MypagePost },
      { path: "comment", component: MypageComment },
    ],
  },

  {
    path: "/place",
    component: PlaceSidebar,
    redirect: "/place/hospital",
    children: [
      { path: "hospital", component: Hospital },
      { path: "beauty", component: Beauty },
    ],
  },

  {
    path: "/schedule",
    component: Schedule,
    beforeEnter: requireLogin,
    children: [
      { path: "detail", component: DetailList },
      { path: "detail/:id", component: DetailItem },
      { path: "detail/record/:id", component: DetailRecordItem },
    ],
  },

  {
    path: "/board",
    component: BoardSidebar,
    redirect: "/board/free",
    children: [
      { path: "information", component: InformationBoard },
      { path: "free", component: FreeBoard },
      { path: ":boardType/post/:idx/modify", component: PostCreate },
      { path: ":boardType/create", component: PostCreate },
      { path: ":boardType/post/:idx", component: PostDetail },

      { path: "qna", component: QnaBoard },
      { path: "qna/create", component: QuestionCreate },
      { path: "qna/:idx/modify", component: QuestionCreate },
      { path: "qna/:idx", component: QuestionDetail },

      { path: "qna/:questionId/answer/create", component: AnswerCreate },
      { path: "qna/:questionId/answer/:idx/modify", component: AnswerCreate },
    ],
  },

  {
    path: "/admin",
    component: Admin,
    redirect: "/admin/profile",
    beforeEnter: adminOnlyGuard,
    children: [
      { path: "profile", component: AdminProfile },
      { path: "category", component: AdminCategory },
      { path: "event", component: AdminEvent },
      { path: "category/schedule", component: ScheduleCategory },
      { path: "category/schedule/fix", component: UpdateScheduleCategory },
      { path: "category/record", component: Record },
      { path: "category/record/fix", component: RecordFix },
      { path: "category/board", component: Board },
      { path: "category/board/fix", component: BoardFix },
      { path: "category/boardtype/fix", component: BoardTypeCategoryFix },
      { path: "category/boardtype", component: BoardTypeCategory },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
