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

export async function uploadChatFile(file, roomId){
    const formData = new FormData();
    formData.append('roomId', roomId)
    formData.append('file', file)
    try{
        const response = await Api.post('v1/chat-attachments/upload',formData,{
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response;
    }catch(error){
        const response = error?.response;
        const data = response?.data;

        console.log('upload error raw:', error);
        console.log('upload error response:', response);
        console.log('upload error data:', data);

        const normalizedError = new Error(
            data?.message || error?.message || '파일 업로드에 실패했습니다.'
        );

        normalizedError.code =
            data?.errorCode ||
            data?.code ||
            'FILE_UPLOAD_FAILED';

        normalizedError.status = response?.status;

        throw normalizedError;
    }
}