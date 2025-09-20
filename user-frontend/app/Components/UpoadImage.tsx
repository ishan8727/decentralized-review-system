'use client'
import { useState } from "react"

const UpoadImage = () => {

  const [images, setImages] = useState<File[]>([]);
  const [task, setTask] = useState('Select The most appropriate image!');

  const uploadImage = (list: FileList | null) => {
    if (!list) {
      return;
    }
    const files = Array.from(list);
    
    console.log(files);
  }

  return (
  <div className="h-[100vh] w-[100vw]">
    <div className="TASK flex-col p-10">
    <p className="text-3xl mb-3 font-bold">
      Create A Task
    </p>
    <div className="">
      <p className="text-xl mb-1 font-bold">Task Details:</p>
          <input className="border rounded-md h-10 mt-2 w-[96vw] text-foreground p-2" placeholder="Enter Task Details" />
    </div>
    </div>
    <div className='rounded-1xl flex items-center justify-center flex-col'>
      <p className="text-2xl mb-2 font-bold">Add images....</p>
      <div className="w-40 h-40 justify-center">
          <div className="flex w-full h-full justify-center text-5xl items-center border rounded-2xl relative">
            +
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              multiple
              onChange={(e) =>{ uploadImage(e.target.files) 
                
              }}
            />
          </div>
        </div>
        <button className="border p-2 text-lg bg-white text-black font-bold cursor-pointer hover:bg-slate-300 rounded-xl mt-5">
          Submit Task
        </button>
        <div className="HiddenDiv border-2 w-full min-h-screen">
            
        </div>
    </div>
  </div>
  )
}

export default UpoadImage;