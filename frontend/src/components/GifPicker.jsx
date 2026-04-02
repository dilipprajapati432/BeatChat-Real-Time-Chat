import { useState, useEffect } from 'react';
import axios from 'axios';
import ClipLoader from 'react-spinners/ClipLoader';
import { Search, X, Image as ImageIcon } from 'lucide-react';

const GifPicker = ({ onSelect, onClose }) => {
    const [search, setSearch] = useState('');
    const [gifs, setGifs] = useState([]);
    const [loading, setLoading] = useState(false);

    // Use a public beta key if no env var is set (for demo purposes only)
    const API_KEY = import.meta.env.VITE_GIPHY_API_KEY || 'pLURtkhVrUXr3KG25Gy5IvzziV5OrZGa';

    const searchGifs = async (query) => {
        setLoading(true);
        try {
            const endpoint = query ? 'search' : 'trending';
            const res = await axios.get(`https://api.giphy.com/v1/gifs/${endpoint}`, {
                params: {
                    api_key: API_KEY,
                    q: query,
                    limit: 30, // Increased limit
                    rating: 'g'
                }
            });
            setGifs(res.data.data);
        } catch (error) {
            console.error("Error fetching GIFs:", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        searchGifs('');
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        searchGifs(search);
    };

    // Debounce search could be added here, but for now simple submit is fine.

    return (
        <div className="absolute bottom-16 right-4 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col z-50 h-[32rem] overflow-hidden animate-scale-in origin-bottom-right">
            {/* Header */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text font-black tracking-tighter text-lg">GIPHY</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Search */}
            <div className="p-3 bg-white dark:bg-slate-900">
                <form onSubmit={handleSearch} className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search for GIFs..."
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500/50 placeholder:text-slate-400 transition-all outline-none"
                        autoFocus
                    />
                </form>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-1 pb-1 custom-scrollbar bg-slate-50 dark:bg-slate-950/30">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                        <ClipLoader size={30} color="#9333ea" />
                        <span className="text-xs font-medium">Loading GIFs...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-1.5 p-1.5">
                        {gifs.length > 0 ? (
                            gifs.map(gif => (
                                <div
                                    key={gif.id}
                                    className="aspect-video relative group cursor-pointer overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800"
                                    onClick={() => onSelect(gif.images.original.url)}
                                >
                                    <img
                                        src={gif.images.fixed_height_small.url}
                                        alt={gif.title}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 py-10 flex flex-col items-center text-slate-400 gap-2">
                                <ImageIcon size={32} className="opacity-50" />
                                <p className="text-sm">No GIFs found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-1.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
                <img src="/powered-by-giphy.png" alt="Powered by GIPHY" className="h-3 mx-auto opacity-50 dark:invert" onError={(e) => e.target.style.display = 'none'} />
                <span className="text-[10px] text-slate-400 font-medium">Powered by GIPHY</span>
            </div>
        </div>
    );
};

export default GifPicker;
