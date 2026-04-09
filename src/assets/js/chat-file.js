import Api from '@/plugins/axios.js'

export async function uploadChatImage(file){
    const formData = new FormData();
    formData.append('file', file)

    const response = await Api.post('v1/chat-files/images',formData,{
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
    return response;
}

export async function uploadChatFile(file){
    const formData = new FormData();
    formData.append('file', file)
    const response = await Api.post('v1/chat-files/files',formData,{
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response;
}