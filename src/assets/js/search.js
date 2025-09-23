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
  if(!res || res.length === 0){
    return [];
  }
  console.log(res.length);
  console.log(res)
  return res;
}
