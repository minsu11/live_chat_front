// src/assets/js/search.js
import api from '@/plugins/axios.js';
import defaultProfile from '@/assets/default_image.png';


let controller;

export async function searchUserByKeyword({ keyword }) {
  if (controller) controller.abort();
  controller = new AbortController();
  console.log("keyword: "+ keyword)

  const res = await api.post('/v1/search/users', {
    userId: keyword
  });

  controller = null;

  // 공통 응답 포맷: { data: SearchUserResponse[] } 가정

  return {
    // 다양한 케이스 대응 (UUID/long/문자열)
    userId: res.userId,
    name: res.name,
    profile: res.profileUrl ?? defaultProfile,
    // 서버가 주면 더 좋음: NONE|PENDING|FRIENDS
  };
}
