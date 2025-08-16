/**
 * 注文者IDから一意のアバターアイコンURLを生成する
 * 同じIDに対して常に同じアイコンを返す
 */
export const getAvatarUrl = (patronId: string): string => {
  // 文字列のハッシュ値を計算して1-5の範囲にマップ
  let hash = 0;
  for (let i = 0; i < patronId.length; i++) {
    const char = patronId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit integer conversion
  }
  
  // 絶対値を取って1-5の範囲にマップ
  const avatarNumber = (Math.abs(hash) % 5) + 1;
  
  return `https://main.d10u60uumh5xr0.amplifyapp.com/icon/avatar_${avatarNumber}.jpeg`;
};