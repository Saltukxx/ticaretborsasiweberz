import {
  AMOUNT_FILTER_OPTIONS,
  CATEGORY_ALL,
  CHANGE_FILTER_OPTIONS,
  COUNT_FILTER_OPTIONS,
  DEFAULT_BULLETIN_FILTERS,
  SORT_OPTIONS,
  VOLUME_FILTER_OPTIONS,
  countActiveBulletinFilters,
  type BulletinFilterState,
} from "../lib/bulletinFilters";
import { formatSaleTypeLabel } from "../lib/priceDisplay";

type Props = {
  filters: BulletinFilterState;
  onChange: (patch: Partial<BulletinFilterState>) => void;
  categories: string[];
  saleTypes: string[];
  resultCount: number;
  totalCount: number;
};

function ChipGroup<T extends string>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onSelect: (value: T) => void;
}) {
  return (
    <div className="pbp__filter-group">
      <span className="pbp__filter-label mono">{label}</span>
      <div className="pbp__filters">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`pbp__chip ${value === opt.value ? "is-active" : ""}`}
            onClick={() => onSelect(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BulletinFilterBar({
  filters,
  onChange,
  categories,
  saleTypes,
  resultCount,
  totalCount,
}: Props) {
  const activeCount = countActiveBulletinFilters(filters);

  return (
    <div className="pbp__filter-panel">
      <div className="pbp__filter-row pbp__filter-row--primary">
        <label className="pbp__search-wrap">
          <span className="sr-only">Ürün ara</span>
          <input
            type="search"
            className="pbp__search mono"
            placeholder="Ürün veya kategori ara…"
            value={filters.query}
            onChange={(e) => onChange({ query: e.target.value })}
          />
        </label>
        <label className="pbp__sort-wrap">
          <span className="pbp__filter-label mono">Sırala</span>
          <select
            className="pbp__sort-select mono"
            value={filters.sort}
            onChange={(e) =>
              onChange({ sort: e.target.value as BulletinFilterState["sort"] })
            }
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <div className="pbp__filter-meta mono">
          <span>
            {resultCount}/{totalCount} ürün
          </span>
          {activeCount > 0 ? (
            <button
              type="button"
              className="pbp__filter-reset"
              onClick={() => onChange(DEFAULT_BULLETIN_FILTERS)}
            >
              Filtreleri sıfırla ({activeCount})
            </button>
          ) : null}
        </div>
      </div>

      {categories.length > 1 ? (
        <div className="pbp__filter-group">
          <span className="pbp__filter-label mono">Kategori</span>
          <div className="pbp__filters pbp__filters--scroll">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`pbp__chip ${filters.category === cat ? "is-active" : ""}`}
                onClick={() => onChange({ category: cat })}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {saleTypes.length > 1 ? (
        <div className="pbp__filter-group">
          <span className="pbp__filter-label mono">Satış şekli</span>
          <div className="pbp__filters pbp__filters--scroll">
            {saleTypes.map((st) => (
              <button
                key={st}
                type="button"
                className={`pbp__chip ${filters.saleType === st ? "is-active" : ""}`}
                onClick={() => onChange({ saleType: st })}
              >
                {st === CATEGORY_ALL ? "Tümü" : formatSaleTypeLabel(st)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="pbp__filter-row pbp__filter-row--metrics">
        <ChipGroup
          label="İşlem miktarı"
          options={VOLUME_FILTER_OPTIONS}
          value={filters.volumeFilter}
          onSelect={(volumeFilter) => onChange({ volumeFilter })}
        />
        <ChipGroup
          label="İşlem tutarı"
          options={AMOUNT_FILTER_OPTIONS}
          value={filters.amountFilter}
          onSelect={(amountFilter) => onChange({ amountFilter })}
        />
        <ChipGroup
          label="İşlem adedi"
          options={COUNT_FILTER_OPTIONS}
          value={filters.countFilter}
          onSelect={(countFilter) => onChange({ countFilter })}
        />
        <ChipGroup
          label="Değişim"
          options={CHANGE_FILTER_OPTIONS}
          value={filters.changeFilter}
          onSelect={(changeFilter) => onChange({ changeFilter })}
        />
      </div>
    </div>
  );
}
