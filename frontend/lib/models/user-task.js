import mongoose from 'mongoose'
import mongooseSequence from 'mongoose-sequence'

const AutoIncrement = mongooseSequence(mongoose)

// mongoose-sequence 는 같은 inc_field 로 두 번 등록되면
// `Counter already defined for field "content_number"` 예외를 던진다.
// 핫리로드로 모듈이 재평가돼도 플러그인이 다시 붙지 않도록 모델이 없을 때만 스키마를 만든다.
function createUserTaskModel() {
  const userTaskSchema = new mongoose.Schema(
    {
      // 저장된 공고 목록 조회(find)와 회원탈퇴 시 정리(deleteMany)가 모두 이 필드로만
      // 걸린다. 인덱스가 없으면 두 쿼리가 컬렉션 전체를 훑는다.
      user_id: { type: String, index: true },
      task_type: String,
      task_title: String,
    },
    { versionKey: false }
  )

  userTaskSchema.plugin(AutoIncrement, { inc_field: 'content_number' })

  // content_number 는 위 정의에 없고 플러그인이 스키마에 넣어 주는 필드라, 인덱스는
  // 플러그인 등록 뒤에 선언해야 한다. 플러그인은 카운터 컬렉션에만 인덱스를 만들고
  // 이 필드에는 만들어 주지 않는다. 공고 1건 삭제(deleteOne)가 이 필드로 걸린다.
  //
  // NOTE: 삭제 키인 만큼 unique 가 맞지만, 기존 데이터에 중복이나 누락이 있으면 인덱스
  // 생성 자체가 실패한다. README '인덱스 확인' 의 중복 점검 쿼리를 돌려 본 뒤
  // unique 로 올리는 것을 권한다.
  userTaskSchema.index({ content_number: 1 })

  return mongoose.model('usertasklists', userTaskSchema)
}

const UserTask = mongoose.models.usertasklists ?? createUserTaskModel()

export default UserTask
