'use client'

import { useState } from 'react'

const OPEN_BUTTON_CLASS =
  'bg-blue-500 text-white active:bg-blue-600 font-bold uppercase text-sm px-4 py-2 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150'
const CLOSE_BUTTON_CLASS =
  'bg-red-400 text-white active:bg-red-500 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150'
const SAVE_BUTTON_CLASS =
  'bg-emerald-500 text-white active:bg-emerald-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150'

export default function ListModal({ lists }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div>
      <div className="flex justify-center p-5">
        <button className={OPEN_BUTTON_CLASS} type="button" onClick={() => setShowModal(true)}>
          Open regular modal
        </button>
      </div>
      {showModal ? (
        <div>
          <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="relative w-auto my-6 mx-auto max-w-3xl">
              <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                <div className="flex items-start justify-between p-5 border-b border-solid border-blueGray-200 rounded-t">
                  <h3 className="text-3xl font-semibold">Modal Title</h3>
                </div>
                <div className="relative p-6 flex-auto">
                  {lists.map((list) => (
                    <div key={list}>{list.split('||')[0]}</div>
                  ))}
                </div>
                <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                  <button
                    className={CLOSE_BUTTON_CLASS}
                    type="button"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </button>
                  <button
                    className={SAVE_BUTTON_CLASS}
                    type="button"
                    onClick={() => setShowModal(false)}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </div>
      ) : null}
    </div>
  )
}
