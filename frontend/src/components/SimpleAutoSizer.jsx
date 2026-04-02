import { useRef, useState, useEffect } from 'react';

const AutoSizer = ({ children, className = "", style = {} }) => {
    const containerRef = useRef(null);
    const [size, setSize] = useState({ height: 0, width: 0 });

    useEffect(() => {
        const resizeObserver = new ResizeObserver((entries) => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setSize({ width, height });
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => resizeObserver.disconnect();
    }, []);

    return (
        <div ref={containerRef} className={className} style={{ width: '100%', height: '100%', overflow: 'hidden', ...style }}>
            {size.height > 0 && size.width > 0 && children(size)}
        </div>
    );
};

export default AutoSizer;
