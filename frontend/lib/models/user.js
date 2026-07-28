import mongoose from 'mongoose'

// 기존 DB 와 호환되어야 하므로 모델명('userlists')·필드명·versionKey 설정을 그대로 옮긴다.
const userSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      unique: true,
    },
    user_pw: {
      type: String,
      required: true,
    },
    e_mail: {
      type: String,
      required: false,
    },
  },
  { versionKey: false }
)

// 개발 서버 핫리로드로 모듈이 재평가될 때 OverwriteModelError 가 나는 것을 막는다.
const User = mongoose.models.userlists ?? mongoose.model('userlists', userSchema)

export default User
