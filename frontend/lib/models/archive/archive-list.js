import mongoose from 'mongoose'

const archiveListSchema = new mongoose.Schema(
  {
    depart_name: String,
    task_type: String,
    //특정 조건의 데이터 아카이브 있는지 여부
    date_range: Array,
  },
  { versionKey: false }
)

// 원본은 `mongoose.Model(...)` (대문자 M) 을 호출해 모델이 만들어지지 않는 상태였다.
// 실제로 참조하는 코드가 없어 드러나지 않았을 뿐이라 올바른 `mongoose.model` 로 고친다.
const ArchiveList =
  mongoose.models.archivelists ?? mongoose.model('archivelists', archiveListSchema)

export default ArchiveList
