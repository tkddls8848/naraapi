export default function NoData({ message = '요청한 데이터가 없습니다.' }) {
  return <div className="col-spans-2 flex justify-center py-4 text-center text-lg">{message}</div>
}
