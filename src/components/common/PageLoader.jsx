import React from 'react';

const PageLoader = () => (
    <div className="flex justify-center items-center h-full w-full">
        <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2" style={{ borderColor: '#2a3f50' }}></div>
    </div>
);

export default PageLoader;