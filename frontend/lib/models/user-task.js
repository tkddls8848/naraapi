import mongoose from 'mongoose'
import mongooseSequence from 'mongoose-sequence'

const AutoIncrement = mongooseSequence(mongoose)

// mongoose-sequence 는 같은 inc_field 로 두 번 등록되면
// `Counter already defined for field "content_number"` 예외를 던진다.
// 핫리로드로 모듈이 재평가돼도 플러그인이 다시 붙지 않도록 모델이 없을 때만 스키마를 만든다.
function createUserTaskModel() {
  const userTaskSchema = new mongoose.Schema(
    {
      user_id: String,
      task_type: String,
      task_title: String,
    },
    { versionKey: false }
  )

  userTaskSchema.plugin(AutoIncrement, { inc_field: 'content_number' })

  return mongoose.model('usertasklists', userTaskSchema)
}

const UserTask = mongoose.models.usertasklists ?? createUserTaskModel()

export default UserTask
