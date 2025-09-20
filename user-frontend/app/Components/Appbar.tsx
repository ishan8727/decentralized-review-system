import React from 'react'

const Appbar = () => {
  return (
    <div className='w-full border-b-2 z-50 bg-[#000] rounded-sm p-5 text-4xl flex justify-between align-middle select-none'>
      <div className="left font-bold text-foreground font-stretch-semi-expanded">Reviewzzz</div>
      <div className="right text-foreground text-2xl">
        <button className='cursor-pointer'>
          Connect Wallet!
        </button>
      </div>
    </div>
  )
}

export default Appbar