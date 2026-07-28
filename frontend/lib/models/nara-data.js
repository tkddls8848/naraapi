import mongoose from 'mongoose'

const naraDataSchema = new mongoose.Schema(
  {
    depart_name: String,
    task_type: String,
    task_data: Object,
  },
  { versionKey: false }
)

const NaraData = mongoose.models.naraData ?? mongoose.model('naraData', naraDataSchema)

export default NaraData
