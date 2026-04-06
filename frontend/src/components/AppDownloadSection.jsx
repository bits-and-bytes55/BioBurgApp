import React from 'react'

function AppDownloadSection () {
  return (
    <div className='w-full py-8 '>
      {' '}
      {/* Light cyan background */}
      <div className='max-w-7xl mx-auto px-4'>
        <div
          className='relative  rounded-2xl overflow-hidden'
          style={{
            backgroundImage:
              "url('/path/to/your/light-pattern-background.png')", // Optional: Agar background mein koi subtle pattern chahiye
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className='flex flex-col md:flex-row items-center justify-center p-8 md:p-12 text-center md:text-left'>
            {/* Left Phone Image */}
            <div className='md:w-1/4 flex justify-center md:justify-end mb-8 md:mb-0 md:mr-8'>
              <img
                src='/appdownloadlogos/leftimage.png' // Placeholder: Replace with your actual left phone image
                alt='PharmEasy App Screenshot Left'
                className='w-48 md:w-full max-w-xs transform -rotate-6 md:-rotate-12 mix-blend-screen'

              />
            </div>

            {/* Middle Content */}
            <div className='md:w-2/4 flex flex-col items-center justify-center space-y-6'>
              <h2 className='text-4xl md:text-5xl font-bold text-gray-800 leading-tight'>
                Simplifying Healthcare <br /> Impacting Lives
              </h2>
              <p className='text-xl text-gray-700 mt-4'>
                Download the App for Free
              </p>
              <div className='flex space-x-4 mt-6'>
                <a
                  href='#'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-block'
                >
                  <img
                    src='/appdownloadlogos/googlepaystorelogo.png'
                    alt='Get it on Google Play'
                    className='h-12 mix-blend-screen'
                  />
                </a>
                <a
                  href='#'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-block'
                >
                  <img
                    src='/appdownloadlogos/appleappstore.svg'
                    alt='Download on the App Store'
                    className='h-12 mix-blend-screen'
                  />
                </a>
              </div>
            </div>

            {/* Right Phone Image */}
            <div className='md:w-1/4 flex justify-center md:justify-start mt-8 md:mt-0 md:ml-8'>
              <img
                src='/appdownloadlogos/rightimage.png' // Placeholder: Replace with your actual right phone image
                alt='PharmEasy App Screenshot Right'
                className='w-48 md:w-full max-w-xs transform rotate-6 md:rotate-12'
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppDownloadSection
