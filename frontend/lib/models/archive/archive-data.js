import mongoose from 'mongoose'

const archiveDataSchema = new mongoose.Schema(
  {
    depart_name: String,
    task_type: String,
    date: String,
    //특정일 공고데이터 모음(여러개일 수 있음)
    task_data: Object,
  },
  { versionKey: false }
)

const ArchiveData = mongoose.models.archives ?? mongoose.model('archives', archiveDataSchema)

export default ArchiveData
