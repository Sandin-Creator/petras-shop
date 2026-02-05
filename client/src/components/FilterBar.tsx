import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const CATEGORIES = ["Clothes", "Shoes", "Accessories"];

export function FilterBar() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { t } = useLanguage();

    const [q, setQ] = useState(searchParams.get("q") || "");
    const [category, setCategory] = useState(searchParams.get("category") || "all");
    const [sort, setSort] = useState(searchParams.get("sort") || "new");
    const [min, setMin] = useState(searchParams.get("min") || "");
    const [max, setMax] = useState(searchParams.get("max") || "");
    const [sale, setSale] = useState(searchParams.get("sale") === "true");
    const [stock, setStock] = useState(false); // Frontend only toggle for now

    // Effect to sync state with URL (optional, if navigation happens elsewhere)
    useEffect(() => {
        setQ(searchParams.get("q") || "");
        setCategory(searchParams.get("category") || "all");
        setSort(searchParams.get("sort") || "new");
        setMin(searchParams.get("min") || "");
        setMax(searchParams.get("max") || "");
        setSale(searchParams.get("sale") === "true");
    }, [searchParams]);

    const updateParams = (updates: any) => {
        const newParams = new URLSearchParams(searchParams);

        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === "" || value === "all" || value === false) {
                newParams.delete(key);
            } else {
                newParams.set(key, String(value));
            }
        });

        setSearchParams(newParams);
    };

    const clearAll = () => {
        setSearchParams({});
        setQ("");
        setCategory("all");
        setSort("new");
        setMin("");
        setMax("");
        setSale(false);
    };

    return (
        <div className="space-y-4 mb-8 bg-card border rounded-lg p-4 shadow-sm">
            {/* Search Row */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder={t.filter.searchPlaceholder}
                    className="w-full pl-9 pr-4 h-10 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={q}
                    onChange={(e) => {
                        setQ(e.target.value);
                        // Debounce could be added here
                        const newParams = new URLSearchParams(searchParams);
                        if (e.target.value) newParams.set('q', e.target.value);
                        else newParams.delete('q');
                        setSearchParams(newParams);
                    }}
                />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-4">
                {/* Category */}
                <select
                    className="h-9 w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={category}
                    onChange={(e) => updateParams({ category: e.target.value })}
                >
                    <option value="all">{t.filter.allCategories}</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                {/* Price Min */}
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        placeholder={t.filter.min}
                        className="h-9 w-24 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={min}
                        onChange={(e) => {
                            setMin(e.target.value);
                            updateParams({ min: e.target.value });
                        }}
                    />
                    <span className="text-muted-foreground">-</span>
                    <input
                        type="number"
                        placeholder={t.filter.max}
                        className="h-9 w-24 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={max}
                        onChange={(e) => {
                            setMax(e.target.value);
                            updateParams({ max: e.target.value });
                        }}
                    />
                </div>

                {/* Sort */}
                <select
                    className="h-9 w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={sort}
                    onChange={(e) => updateParams({ sort: e.target.value })}
                >
                    <option value="new">{t.filter.sort.newest}</option>
                    <option value="price-asc">{t.filter.sort.priceLowHigh}</option>
                    <option value="price-desc">{t.filter.sort.priceHighLow}</option>
                    <option value="name-asc">{t.filter.sort.nameAZ}</option>
                </select>

                {/* Toggles */}
                <button
                    onClick={() => {
                        const newVal = !sale;
                        setSale(newVal);
                        updateParams({ sale: newVal });
                    }}
                    className={`h-9 px-4 rounded-md text-sm font-medium transition-colors border ${sale ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent hover:bg-muted text-foreground'}`}
                >
                    {t.filter.onSale}
                </button>

                <button
                    onClick={() => setStock(!stock)}
                    className={`h-9 px-4 rounded-md text-sm font-medium transition-colors border ${stock ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent hover:bg-muted text-foreground'}`}
                >
                    {t.filter.inStock}
                </button>
            </div>

            {/* Active Filters Summary / Clear */}
            <div className="flex items-center gap-2">
                <button
                    className="text-xs font-medium px-3 py-1 bg-secondary text-secondary-foreground rounded-full"
                    onClick={() => updateParams({ sort: 'new' })} // Dummy Compact View
                >
                    {t.filter.compactView}
                </button>

                <button
                    className="text-xs font-medium px-3 py-1 text-muted-foreground hover:text-foreground"
                    onClick={clearAll}
                >
                    {t.filter.clearAll}
                </button>
            </div>
        </div>
    );
}
