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
  'ba':  ['芭','拔','把','爸'], 'bo':  ['波','伯','跛','薄'],
  'bi':  ['逼','鼻','比','必'], 'bu':  ['','','补','不'],
  'bei': ['杯','','北','备'], 'bao': ['包','','宝','报'],
  'ban': ['班','','板','半'], 'ben': ['奔','','本','笨'],
  'bang':['帮','','绑','棒'], 'bing':['冰','','饼','病'],
  'bou': ['','','',''],
  // p-
  'pa':  ['趴','爬','','怕'], 'po':  ['坡','婆','簸','破'],
  'pi':  ['批','皮','匹','屁'], 'pu':  ['扑','仆','普','瀑'],
  'pao': ['抛','袍','跑','炮'], 'pei': ['胚','陪','','配'],
  'pan': ['潘','盘','','盼'], 'pen': ['喷','盆','',''],
  'pang':['乓','旁','','胖'], 'ping':['乒','平','','聘'],
  // m-
  'ma':  ['妈','麻','马','骂'], 'mo':  ['摸','模','抹','末'],
  'mi':  ['咪','迷','米','密'], 'mu':  ['','睦','母','木'],
  'mai': ['','埋','买','卖'], 'mei': ['','梅','美','妹'],
  'mao': ['猫','毛','卯','帽'], 'mou': ['哞','谋','某',''],
  'man': ['','','满','慢'], 'men': ['','门','','闷'],
  'ming':['','明','','命'], 'mang':['','忙','莽',''],
  // f-
  'fa':  ['发','罚','法','发'], 'fo':  ['','佛','',''],
  'fu':  ['夫','福','府','父'], 'fei': ['飞','肥','匪','费'],
  'fan': ['翻','凡','反','饭'], 'fen': ['分','坟','粉','份'],
  'feng':['风','逢','讽','奉'],
  // d-
  'da':  ['搭','答','打','大'], 'de':  ['','得','','地'],
  'di':  ['低','敌','底','地'], 'du':  ['都','读','赌','度'],
  'dai': ['呆','','歹','代'], 'dei': ['','','得',''],
  'dao': ['刀','','岛','到'], 'dou': ['都','','抖','豆'],
  'die': ['跌','叠','嗲',''],
  'dan': ['单','谈','胆','蛋'], 'den': ['','','',''],
  'din': ['','','',''], 'dong':['东','动','懂','冻'],
  'dang':['当','','党','当'], 'deng':['登','','等','凳'],
  'ding':['丁','','顶','定'],
  // t-
  'ta':  ['他','','塔','踏'], 'te':  ['','','','特'],
  'ti':  ['梯','提','体','替'], 'tu':  ['秃','图','土','兔'],
  'tai': ['胎','台','','太'], 'tao': ['掏','逃','讨','套'],
  'tou': ['偷','头','','透'], 'tie': ['贴','','铁',''],
  'tan': ['贪','谈','坦','叹'], 'ten': ['','','',''],
  'tang':['汤','糖','躺','烫'], 'teng':['','疼','',''],
  'ting':['听','廷','挺',''], 'tong':['通','同','桶','痛'],
  // n-
  'na':  ['','拿','哪','那'], 'ne':  ['','','','呢'],
  'ni':  ['妮','泥','你','逆'], 'nu':  ['','奴','弩','怒'],
  'nai': ['','奶','','耐'], 'nei': ['','','','内'],
  'nao': ['孬','挠','恼','闹'], 'nie': ['捏','','捏','聂'],
  'nin': ['','您','',''], 'nan': ['','男','','难'],
  'nen': ['','','','嫩'], 'nang':['囔','','曩',''],
  'neng':['','能','',''], 'ning':['宁','宁','拧','佞'],
  'nong':['','农','弄','弄'],
  // l-
  'la':  ['拉','','喇','辣'], 'le':  ['勒','','','乐'],
  'li':  ['喱','离','礼','立'], 'lu':  ['噜','炉','鲁','路'],
  'lai': ['','来','睐','赖'], 'lei': ['擂','雷','累','类'],
  'lao': ['捞','劳','老','烙'], 'lou': ['楼','楼','搂','露'],
  'lie': ['咧','','','列'], 'liu': ['溜','刘','柳','六'],
  'lan': ['兰','兰','懒','烂'], 'lin': ['拎','林','凛','吝'],
  'lun': ['','轮','','论'], 'lang':['郎','郎','朗','浪'],
  'leng':['棱','','冷','愣'], 'ling':['拎','灵','岭','令'],
  'long':['隆','隆','拢','弄'],
  // g-
  'ga':  ['夹','嘎','嘎','尬'], 'ge':  ['割','阁','各','各'],
  'gu':  ['姑', '古','股','故'], 'gai': ['该','','改','概'],
  'gei': ['','','给',''], 'gao': ['高','','搞','告'],
  'gou': ['沟','','狗','够'], 'gan': ['干','杆','改','干'],
  'gen': ['根','','','亘'], 'gang':['刚','','港','杠'],
  'geng':['更','耕','耿','更'], 'gong':['工','弓','巩','共'],
  // k-
  'ka':  ['咖','','卡',''], 'ke':  ['科','壳','可','客'],
  'ku':  ['哭','','苦','库'], 'kai': ['开','','凯',''],
  'kao': ['','','考','靠'], 'kou': ['口','','口','扣'],
  'kan': ['刊','','砍','看'], 'ken': ['','','','恳'],
  'kang':['康','扛','慷','抗'], 'keng':['坑','','',''],
  'kong':['空','','空','控'],
  // h-
  'ha':  ['哈','蛤','哈',''], 'he':  ['喝','河','何','褐'],
  'hu':  ['呼','胡','虎','护'], 'hai': ['咳','孩','海','害'],
  'hei': ['黑','','',''], 'hao': ['毫', '豪','好','号'],
  'hou': ['齁','侯','吼','后'], 'han': ['憨','寒','罕','汉'],
  'hen': ['','痕','很','恨'], 'hang':['夯','航','','巷'],
  'heng':['哼','恒','',''], 'hong':['轰','红','哄','哄'],
  // j-
  'ji':  ['鸡','极','己','记'], 'jie': ['接','洁','姐','解'],
  'jiu': ['纠','久','九','旧'], 'jin': ['今','','紧','进'],
  'jian':['肩','简','拣','见'], 'jing':['京','睛','景','竟'],
  // q-
  'qi':  ['七','齐','起','气'], 'qie': ['切','茄','且','窃'],
  'qiu': ['丘','球','','去'], 'qin': ['亲','琴','寝','沁'],
  'qian':['千','钱','浅','欠'], 'qing':['青','晴','请','庆'],
  // x-
  'xi':  ['西','习','喜','系'], 'xie': ['些','邪','写','谢'],
  'xiu': ['休','修','羞','秀'], 'xin': ['心','新','信','信'],
  'xian':['先','咸','险','现'], 'xing':['星','行','醒','性'],
  // zh-
  'zha': ['扎','闸','眨','榨'], 'zhe': ['遮', '哲','这','这'],
  'zhi': ['之','直','指','至'], 'zhu': ['猪','竹','主','助'],
  'zhai':['摘','宅','窄','债'], 'zhao':['招','','找','照'],
  'zhou':['周','轴','帚','咒'], 'zhan':['占','粘','斩','占'],
  'zhen':['真','呈','枕','镇'], 'zhang':['张','','掌','帐'],
  'zheng':['蒸','','整','正'], 'zhong':['中','','肿','众'],
  // ch-
  'cha': ['插','查','茶','差'], 'che': ['车','','扯','撤'],
  'chi': ['吃','迟','尺','赤'], 'chu': ['出','厨','楚','处'],
  'chao':['抄','朝','吵','炒'], 'chou':['抽','畴','丑','臭'],
  'chan':['搀','缠','产','颤'], 'chen':['抻','沉','碜','衬'],
  'chang':['昌','长','场','唱'], 'cheng':['称','成','逞','秤'],
  'chong':['充','崇','宠','冲'],
  // sh-
  'sha': ['杀','啥','傻','霎'], 'she': ['奢','蛇','舍','设'],
  'shi': ['失','时','使','是'], 'shu': ['书','熟','鼠','树'],
  'shao':['烧','勺','少','哨'], 'shou':['收','熟','手','受'],
  'shan':['山','擅','闪','善'], 'shen':['深','什','哂','慎'],
  'shang':['商','','赏','上'], 'sheng':['声','生','省','胜'],
  // r-
  're':  ['','','惹','热'], 'ri':  ['','','','日'],
  'ru':  ['','如','乳','入'], 'rao': ['','饶','绕','绕'],
  'rou': ['','柔','','肉'], 'ran': ['','然','染','然'],
  'ren': ['','人', '忍','认'], 'rang':['','瓤','嚷','让'],
  'reng':['扔','仍','',''], 'rong':['','容','','绒'],
  // z-
  'za':  ['匝','杂','',''], 'ze':  ['','则','责','泽'],
  'zi':  ['姿','','子','字'], 'zu':  ['租','族','阻','足'],
  'zai': ['灾','','宰','再'], 'zao': ['遭','凿','早','造'],
  'zou': ['走','邹','奏','走'], 'zan': ['簪','咱','昝','赞'],
  'zen': ['','','怎',''], 'zang':['赃','','臧','葬'],
  'zeng':['增','','','赠'], 'zong':['综','','总','纵'],
  // c-
  'ca':  ['嚓','','',''], 'ce':  ['','','','策'],
  'ci':  ['疵','词','此','刺'], 'cu':  ['粗','','','促'],
  'cai': ['猜','才','采','菜'], 'cao': ['操','曹','草','糙'],
  'cou': ['凑','','','凑'], 'can': ['餐','残','惨','灿'],
  'cen': ['','岑','',''], 'cang':['苍','藏','','仓'],
  'ceng':['','层','','蹭'], 'cong':['聪','从','',''],
  // s-
  'sa':  ['撒','','洒','萨'], 'se':  ['涩','','','色'],
  'si':  ['丝','','死','四'], 'su':  ['苏','','素','速'],
  'sai': ['腮','','','赛'], 'sao': ['嫂','扫','搔','扫'],
  'sou': ['飕','搜','擞','嗽'], 'san': ['三','','伞','散'],
  'sen': ['森','','',''], 'sang':['嗓','','颡','丧'],
  'seng':['僧','','',''], 'song':['忪','怂','耸','诵'],
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

  // Stop any previous speech
  window.speechSynthesis.cancel();

  // Prefer Google TTS for specific characters if available
  if (char && char !== '') {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(char)}&tl=zh-CN&client=tw-ob&ts=${Date.now()}`;
    const audio = new Audio(url);
    audio.play().catch(() => speakByVoice(char));
    return;
  }

  // Fallback to Web Speech API with tone marks
  const toned = addToneMark(syllable, tone);
  speakByVoice(toned);
};

const speakByVoice = (text: string) => {
  const voices = window.speechSynthesis.getVoices();
  // Find a high-quality Chinese voice
  const zhVoice = voices.find(v => v.lang === 'zh-CN' && v.name.includes('Google')) || 
                  voices.find(v => v.lang === 'zh-CN') || 
                  voices.find(v => v.lang.startsWith('zh'));
  
  if (!zhVoice) return;
  
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
