export type LocationSource = 'search' | 'gps';

/** 应用内的统一地点模型；搜索与 GPS 定位共用 */
export interface Location {
  /** geocoding 的数字 id；GPS 地点使用 `${lat4},${lon4}` */
  id: string;
  name: string;
  admin1?: string;
  country?: string;
  countryCode?: string;
  lat: number;
  lon: number;
  source: LocationSource;
  isCurrent?: boolean;
  /** geocoding 返回的人口数，仅用于搜索结果排序，不参与展示 */
  population?: number;
}

/** addLocation 的结果：写入成功 / 已存在并切换 / 达到数量上限 */
export type AddLocationResult = 'added' | 'exists' | 'limit';

/** 地点 Context 的对外接口：列表、选中项与增删选方法 */
export interface LocationsContextValue {
  /** 含 GPS 项的完整列表；GPS 项存在时始终位于首位 */
  locations: readonly Location[];
  /** 当前选中的地点 id；未选中时为 null */
  activeId: string | null;
  /** 选中项对应的地点；未选中或已失效时为 null */
  activeLocation: Location | null;
  /** 本地恢复是否完成；完成前不应回写存储 */
  ready: boolean;
  /** 添加地点：重复时自动切换选中，达到上限时不写入 */
  addLocation: (location: Location) => AddLocationResult;
  /** 删除用户地点；GPS 项不可删除，选中项会切到前一项或后一项 */
  removeLocation: (id: string) => void;
  /** 只接受列表中存在的 id，避免选中项指向不存在的地点 */
  setActiveId: (id: string) => void;
  /** 用新坐标覆盖 GPS 项；名称由反查结果异步补齐 */
  updateGps: (lat: number, lon: number) => void;
}
