"use client";

import React, { useState, useEffect } from 'react';
import styles from './phonetics.module.css';
import { Volume2, X } from 'lucide-react';

const INITIALS = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's'];
const FINALS_SAMPLE = ['a', 'o', 'e', 'i', 'u', 'ai', 'ei', 'ao', 'ou', 'ie', 'an', 'en', 'in', 'ang', 'eng', 'ing', 'ong'];

// Dấu thanh điệu Unicode chính xác cho 4 thanh
const TONE_MARKS: Record<string, string[]> = {
  'a': ['a','ā','á','ǎ','à'], 'o': ['o','ō','ó','ǒ','ò'],
  'e': ['e','ē','é','ě','è'], 'i': ['i','ī','í','ǐ','ì'],
  'u': ['u','ū','ú','ǔ','ù'], 'ü': ['ü','ǖ','ǘ','ǚ','ǜ'],
};
const VOWEL_PRIORITY = ['a', 'o', 'e', 'ü', 'i', 'u'];

const addToneMark = (syllable: string, tone: number): string => {
  if (!tone) return syllable;
  if (syllable.endsWith('ui')) return syllable.slice(0,-1) + (TONE_MARKS.i?.[tone] ?? 'i');
  if (syllable.endsWith('iu')) return syllable.slice(0,-1) + (TONE_MARKS.u?.[tone] ?? 'u');
  for (const v of VOWEL_PRIORITY) {
    if (syllable.includes(v) && TONE_MARKS[v]) return syllable.replace(v, TONE_MARKS[v][tone]);
  }
  return syllable;
};

/**
 * Bảng chữ Hán đại diện cho 4 thanh điệu của các âm tiết phổ biến.
 * Google TTS zh-CN đọc chữ Hán hoàn toàn chuẩn - đây là cách đáng tin nhất.
 * Format: syllable → [tone1_char, tone2_char, tone3_char, tone4_char]
 */
const CHAR_MAP: Record<string, [string,string,string,string]> = {
  // b-
  'ba':  ['芭','拔','把','爸'], 'bo':  ['波','薄','跛','泊'],
  'bi':  ['逼','鼻','比','必'], 'bu':  ['补','部','不','步'],
  'bei': ['杯','陪','被','被'], 'bao': ['包','薄','保','报'],
  'ban': ['班','盘','板','半'], 'ben': ['奔','笨','本','笨'],
  'bang':['帮','旁','榜','棒'], 'bing':['冰','病','饼','病'],
  'bou': ['','','',''], // 不存在
  // p-
  'pa':  ['趴','爬','跑','怕'], 'po':  ['坡','婆','颇','破'],
  'pi':  ['批','疲','匹','屁'], 'pu':  ['铺','蒲','普','铺'],
  'pao': ['抛','袍','跑','炮'], 'pei': ['胚','培','配','配'],
  'pan': ['潘','盘','判','盼'], 'pen': ['喷','盆','喷','喷'],
  'pang':['乓','旁','胖','胖'], 'ping':['乒','平','瓶','聘'],
  // m-
  'ma':  ['妈','麻','马','骂'], 'mo':  ['摸','模','摩','末'],
  'mi':  ['迷','谜','米','秘'], 'mu':  ['木','目','亩','木'],
  'mai': ['买','买','买','卖'], 'mei': ['没','没','每','妹'],
  'mao': ['猫','毛','帽','茂'], 'mou': ['谋','谋','某','谋'],
  'man': ['慢','蛮','满','慢'], 'men': ['门','们','们','闷'],
  'ming':['明','名','命','命'], 'mang':['忙','忙','忙','忙'],
  // f-
  'fa':  ['发','罚','法','发'], 'fo':  ['佛','佛','佛','佛'],
  'fu':  ['夫','服','府','父'], 'fei': ['飞','肥','费','费'],
  'fan': ['番','凡','反','饭'], 'fen': ['分','粉','份','愤'],
  'feng':['风','逢','讽','奉'],
  // d-
  'da':  ['搭','答','打','大'], 'de':  ['得','得','得','的'],
  'di':  ['低','敌','底','地'], 'du':  ['都','读','独','度'],
  'dai': ['呆','代','待','待'], 'dei': ['得','得','得','的'],
  'dao': ['刀','导','岛','到'], 'dou': ['兜','豆','斗','豆'],
  'die': ['蝶','叠','蝶','跌'], 'dou': ['兜','豆','斗','豆'],
  'dan': ['单','谈','胆','蛋'], 'den': ['','','',''],
  'din': ['','','',''], 'dong':['东','动','懂','冻'],
  'dang':['当','当','党','当'], 'deng':['灯','等','等','凳'],
  'ding':['丁','定','顶','定'],
  // t-
  'ta':  ['他','塔','踏','了'], 'te':  ['特','特','特','特'],
  'ti':  ['梯','题','体','替'], 'tu':  ['突','图','土','吐'],
  'tai': ['台','抬','太','态'], 'tao': ['掏','逃','讨','套'],
  'tou': ['头','投','偷','透'], 'tie': ['贴','铁','贴','铁'],
  'tan': ['摊','谈','毯','叹'], 'ten': ['','','',''],
  'tang':['汤','糖','躺','烫'], 'teng':['疼','腾','疼','疼'],
  'ting':['听','庭','挺','听'], 'tong':['通','同','桶','痛'],
  // n-
  'na':  ['拿','那','哪','那'], 'ne':  ['呢','呢','呢','呢'],
  'ni':  ['泥','尼','你','腻'], 'nu':  ['努','奴','女','怒'],
  'nai': ['奶','耐','乃','奈'], 'nei': ['哪','那','哪','内'],
  'nao': ['挠','脑','脑','闹'], 'nou': ['','','',''],
  'nie': ['捏','聂','捏','捏'], 'nin': ['您','您','您','您'],
  'nan': ['难','男','南','难'], 'nen': ['嫩','嫩','嫩','嫩'],
  'nang':['囊','囊','囊','囊'], 'neng':['能','能','能','能'],
  'ning':['宁','凝','拧','宁'], 'nong':['农','浓','弄','弄'],
  // l-
  'la':  ['拉','蜡','辣','辣'], 'le':  ['了','了','了','了'],
  'li':  ['离','李','里','力'], 'lu':  ['路','炉','鲁','绿'],
  'lai': ['来','来','来','赖'], 'lei': ['雷','泪','累','类'],
  'lao': ['捞','老','劳','涝'], 'lou': ['楼','楼','漏','漏'],
  'lie': ['列','烈','列','劣'], 'liu': ['流','留','柳','六'],
  'lan': ['拦','兰','懒','烂'], 'len': ['','','',''],
  'lin': ['林','邻','凛','临'], 'lun': ['论','伦','轮','论'],
  'lang':['狼','廊','朗','浪'], 'leng':['冷','冷','冷','冷'],
  'ling':['铃','零','岭','令'], 'long':['龙','龙','拢','弄'],
  // g-
  'ga':  ['嘎','轧','嘎','嘎'], 'ge':  ['割','歌','个','个'],
  'gu':  ['姑','骨','古','固'], 'gai': ['该','盖','改','盖'],
  'gei': ['给','给','给','给'], 'gao': ['高','膏','搞','告'],
  'gou': ['沟','狗','够','够'], 'gan': ['干','肝','感','干'],
  'gen': ['根','跟','恳','跟'], 'gang':['刚','岗','港','杠'],
  'geng':['更','更','耕','更'], 'gong':['工','共','拱','贡'],
  // k-
  'ka':  ['卡','卡','卡','咖'], 'ke':  ['科','克','可','课'],
  'ku':  ['哭','物','苦','酷'], 'kai': ['开','楷','慨','盖'],
  'kao': ['烤','靠','考','靠'], 'kou': ['口','扣','叩','扣'],
  'kan': ['看','刊','坎','看'], 'ken': ['肯','肯','垦','肯'],
  'kang':['扛','抗','慷','抗'], 'keng':['坑','坑','坑','坑'],
  'kong':['空','空','孔','控'],
  // h-
  'ha':  ['哈','哈','哈','哈'], 'he':  ['喝','河','何','喝'],
  'hu':  ['呼','狐','虎','护'], 'hai': ['嗨','孩','海','害'],
  'hei': ['嘿','黑','嘿','嘿'], 'hao': ['嚎','毫','好','号'],
  'hou': ['猴','喉','吼','后'], 'han': ['汉','含','罕','汉'],
  'hen': ['痕','很','很','狠'], 'hang':['行','航','杭','行'],
  'heng':['哼','横','哼','哼'], 'hong':['轰','红','哄','哄'],
  // j-
  'ji':  ['鸡','极','己','记'], 'jie': ['接','节','姐','介'],
  'jiu': ['纠','旧','九','就'], 'jin': ['今','近','紧','进'],
  'jian':['间','监','减','见'], 'jing':['京','睛','景','竟'],
  // q-
  'qi':  ['七','齐','起','气'], 'qie': ['切','茄','且','切'],
  'qiu': ['秋','球','裘','求'], 'qin': ['亲','琴','请','请'],
  'qian':['千','钱','浅','欠'], 'qing':['青','情','请','庆'],
  // x-
  'xi':  ['西','习','喜','系'], 'xie': ['些','邪','写','谢'],
  'xiu': ['休','修','羞','秀'], 'xin': ['心','新','信','信'],
  'xian':['先','咸','险','现'], 'xing':['星','行','醒','性'],
  // zh-
  'zha': ['扎','炸','炸','炸'], 'zhe': ['着','这','者','这'],
  'zhi': ['只','知','止','志'], 'zhu': ['猪','助','主','住'],
  'zhai':['摘','债','窄','债'], 'zhao':['招','着','找','照'],
  'zhou':['周','粥','肘','皱'], 'zhan':['占','展','战','战'],
  'zhen':['针','真','阵','振'], 'zhang':['张','长','掌','账'],
  'zheng':['争','正','整','政'], 'zhong':['中','种','肿','重'],
  // ch-
  'cha': ['插','茶','差','叉'], 'che': ['车','扯','彻','彻'],
  'chi': ['吃','迟','尺','翅'], 'chu': ['出','除','楚','处'],
  'chao':['吵','炒','抄','潮'], 'chou':['抽','仇','丑','臭'],
  'chan':['搀','缠','产','颤'], 'chen':['沉','陈','趁','趁'],
  'chang':['场','偿','厂','唱'], 'cheng':['城','程','澄','称'],
  'chong':['冲','虫','宠','充'],
  // sh-
  'sha': ['沙','傻','厦','厦'], 'she': ['蛇','奢','舌','摄'],
  'shi': ['失','时','史','是'], 'shu': ['书','熟','鼠','树'],
  'shao':['烧','勺','少','少'], 'shou':['收','熟','手','售'],
  'shan':['山','蝉','闪','善'], 'shen':['深','身','沈','慎'],
  'shang':['上','商','赏','尚'], 'sheng':['声','生','省','胜'],
  'shou':['收','熟','手','兽'],
  // r-
  'ra':  ['','','',''], 're':  ['热','热','热','热'],
  'ri':  ['日','日','日','日'], 'ru':  ['入','乳','汝','入'],
  'rao': ['绕','扰','绕','绕'], 'rou': ['肉','柔','揉','肉'],
  'ran': ['燃','然','染','然'], 'ren': ['人','仁','忍','认'],
  'rang':['让','嚷','让','让'], 'reng':['扔','仍','扔','扔'],
  'rong':['荣','熔','绒','荣'],
  // z-
  'za':  ['杂','砸','扎','杂'], 'ze':  ['则','泽','责','泽'],
  'zi':  ['滋','自','子','字'], 'zu':  ['组','足','粗','祖'],
  'zai': ['灾','宰','在','再'], 'zao': ['早','造','找','皂'],
  'zou': ['走','邹','奏','走'], 'zan': ['暂','赞','攒','咱'],
  'zen': ['怎','怎','怎','怎'], 'zang':['脏','脏','脏','葬'],
  'zeng':['增','曾','增','赠'], 'zong':['综','总','棕','纵'],
  // c-
  'ca':  ['擦','擦','擦','擦'], 'ce':  ['测','侧','测','侧'],
  'ci':  ['此','词','此','刺'], 'cu':  ['粗','促','醋','促'],
  'cai': ['猜','材','采','菜'], 'cao': ['草','潮','操','草'],
  'cou': ['凑','凑','凑','凑'], 'can': ['参','惭','惨','灿'],
  'cen': ['参','岑','岑','岑'], 'cang':['仓','藏','藏','藏'],
  'ceng':['曾','层','层','蹭'], 'cong':['聪','从','丛','聪'],
  // s-
  'sa':  ['撒','洒','洒','散'], 'se':  ['色','涩','瑟','色'],
  'si':  ['丝','私','死','四'], 'su':  ['苏','素','速','宿'],
  'sai': ['塞','赛','赛','腮'], 'sao': ['嫂','扫','搔','扫'],
  'sou': ['搜','叟','叟','馊'], 'san': ['三','散','伞','散'],
  'sen': ['森','森','森','森'], 'sang':['桑','丧','嗓','嗓'],
  'seng':['僧','僧','僧','僧'], 'song':['松','送','颂','颂'],
  'sin': ['','','',''], 'sing':['','','',''],
};

const TONE_INFO = [
  { num: 1, symbol: '—', name: 'Thanh Bình (ngang)', color: '#60a5fa' },
  { num: 2, symbol: 'ˊ', name: 'Thanh Dương Bình (sắc)', color: '#34d399' },
  { num: 3, symbol: 'ˇ', name: 'Thanh Thượng (hỏi-nặng)', color: '#fbbf24' },
  { num: 4, symbol: 'ˋ', name: 'Thanh Khứ (nặng)', color: '#f87171' },
];

/**
 * Phát âm bằng chữ Hán → Google TTS zh-CN (chuẩn người Trung, đúng thanh điệu)
 * Fallback: Web Speech API với giọng Trung được chọn rõ ràng.
 */
const playTone = (syllable: string, tone: number) => {
  if (typeof window === 'undefined') return;

  const key = syllable.toLowerCase();
  const chars = CHAR_MAP[key];
  const char = chars?.[tone - 1];

  // Nếu có chữ Hán trong map, dùng Google TTS
  if (char) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(char)}&tl=zh-CN&client=tw-ob&ts=${Date.now()}`;
    new Audio(url).play().catch(() => speakByVoice(char));
    return;
  }

  // Fallback: tone mark + Web Speech API Chinese voice
  const toned = addToneMark(syllable, tone);
  speakByVoice(toned);
};

const speakByVoice = (text: string) => {
  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find(v => v.lang === 'zh-CN') || voices.find(v => v.lang.startsWith('zh'));
  if (!zhVoice) return; // Không dùng giọng Anh
  window.speechSynthesis.cancel();
  const utt = new window.SpeechSynthesisUtterance(text);
  utt.voice = zhVoice;
  utt.lang = 'zh-CN';
  utt.rate = 0.8;
  window.speechSynthesis.speak(utt);
};

export default function PinyinCombinationTable() {
  const [activeSyllable, setActiveSyllable] = useState<string | null>(null);

  // Preload voices on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.getVoices();
    }
  }, []);

  return (
    <div className={styles.section} id="combination-table">
      <h2 className={styles.sectionTitle}>Bảng Ghép Âm &amp; Thanh Điệu</h2>
      <p className={styles.subtitle}>Nhấp vào ô để nghe đúng 4 thanh điệu (phát âm chuẩn người Trung).</p>

      <div className={styles.tableWrapper}>
        <table className={styles.fullTable}>
          <thead>
            <tr>
              <th>Thanh\Vận</th>
              {FINALS_SAMPLE.map(f => <th key={f}>{f}</th>)}
            </tr>
          </thead>
          <tbody>
            {INITIALS.map(initial => (
              <tr key={initial}>
                <th className={styles.initialHeaderEdge}>{initial}</th>
                {FINALS_SAMPLE.map(final => (
                  <td
                    key={final}
                    className={styles.pinyinCellClickable}
                    onClick={() => setActiveSyllable(initial + final)}
                  >
                    <div className={styles.pinyinCellInner}>{initial}{final}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeSyllable && (
        <div className={styles.modalOverlay} onClick={() => setActiveSyllable(null)}>
          <div className={styles.tonePopContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popHeader}>
              <h3>Chọn thanh điệu: <span className={styles.accentText}>{activeSyllable}</span></h3>
              <button className={styles.closeBtnSmall} onClick={() => setActiveSyllable(null)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.toneGrid}>
              {TONE_INFO.map(({ num, symbol, name, color }) => {
                const toned = addToneMark(activeSyllable, num);
                const key = activeSyllable.toLowerCase();
                const chars = CHAR_MAP[key];
                const char = chars?.[num - 1];
                return (
                  <button
                    key={num}
                    className={styles.toneBtnLarge}
                    onClick={() => playTone(activeSyllable, num)}
                    style={{ borderColor: color + '88' }}
                  >
                    <div className={styles.toneVisual}>
                      <span className={styles.tonedCharBig} style={{ color }}>{toned}</span>
                      {char && <span style={{ fontSize: '1.5rem', opacity: 0.5 }}>{char}</span>}
                      <Volume2 size={18} className={styles.volumeIcon} />
                    </div>
                    <span className={styles.toneDesc} style={{ color }}>Thanh {num} {symbol}</span>
                    <div className={styles.toneHint}>{name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
