"""
Builds source/app/data/gamedata.js: the facts about the game that the editor needs.

    python build_data.py --work <work folder> --code <exefs/code.bin> [--out <gamedata.js>]

The work folder holds the inputs taken from your own copy of the game (see README.md in this folder):
corpus.json (every official quest, from corpus.js), msgs.json (monster and item names of the game's
texts), em_base_hp.json (base HP of the monsters), dlc_tables.json (DLC quest IDs and their monsters,
from code.bin) and constants.json (from dump_constants.js).
"""
import argparse, json, os, re, collections, struct, sys
if os.environ.get('PYTHONHASHSEED') != '0':      # same output on every run (some tables are built from sets)
    os.environ['PYTHONHASHSEED'] = '0'
    os.execv(sys.executable, [sys.executable] + sys.argv)
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
from data.monster_info import INFO, SPECIES

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('--work', required=True, help='folder with corpus.json, msgs.json, em_base_hp.json, dlc_tables.json, constants.json')
ap.add_argument('--code', required=True, help="the game's exefs/code.bin (decompressed)")
ap.add_argument('--out', default=os.path.join(ROOT, 'source', 'app', 'data', 'gamedata.js'))
args = ap.parse_args()
W = lambda name: os.path.join(args.work, name)

corpus = json.load(open(W('corpus.json')))
_norm = lambda t: re.sub(r"[^a-z0-9]", '', t.replace(u'\u2019', "'").lower())
_wiki = set(_norm(t) for t in json.load(open(os.path.join(HERE, 'wiki_event_titles.json'))) + json.load(open(os.path.join(HERE, 'fandom_titles.json'))))
# two titles are spelled differently on the wiki and in the game
_wiki |= set(_norm(t) for t in ['Only the Strong Survive', 'Uniqlo: Material Needs'])
# quests of the save that are not on the wiki lists are custom quests: they are left out of every statistic
n_before = len(corpus)
corpus = [q for q in corpus if not (q['_src'] == 'event' and q['quest_id'] // 1000 in (60, 62) and _norm(q['text'][0][0]) not in _wiki)]
print('custom quests left out of the data:', n_before - len(corpus))
msgs = json.load(open(W('msgs.json')))
hp = {int(k): v for k, v in json.load(open(W('em_base_hp.json'))).items()}
dlc = json.load(open(W('dlc_tables.json')))
code = open(args.code, 'rb').read()
K = json.load(open(W('constants.json')))

OUT = {}
# ---------------------------------------------------------------- difficulty table
rows = []
for r in range(141):
    rows.append([round(x, 3) for x in struct.unpack_from('<8f', code, 0xe3a330 + r * 32)])
OUT['diff_table'] = rows
OUT['base_hp'] = hp

# ---------------------------------------------------------------- monsters
by_id = {q['quest_id']: q for q in corpus}
first_guild = {}
first_any = {}
for q in corpus:
    qid = q['quest_id']
    mons = set(m['monster_id'] for w in q['large_monster_table'] for m in w)
    for mid in mons:
        if 10000 <= qid < 20000:
            first_guild[mid] = min(first_guild.get(mid, 99), q['quest_rank'])
        first_any[mid] = min(first_any.get(mid, 99), q['quest_rank'])
mons = {}
for mid in range(1, 124):
    sp, diff, kind = INFO[mid]
    nm_en = msgs['en_emName'][mid] if mid < len(msgs['en_emName']) else K['monsters'][str(mid)]
    nm_fr = msgs['fr_emName'][mid] if mid < len(msgs['fr_emName']) else nm_en
    mons[mid] = {'en': K['monsters'][str(mid)], 'game_en': nm_en, 'fr': nm_fr, 'species': sp, 'diff': diff, 'kind': kind,
                 'guild_rank': first_guild.get(mid), 'base_hp': hp.get(mid)}
OUT['monsters'] = mons
OUT['species'] = {k: {'en': v[0], 'fr': v[1]} for k, v in SPECIES.items()}

# ---------------------------------------------------------------- DLC ids, restrictions, official titles
master = []
for v in dlc['master']:
    if v not in master: master.append(v)
OUT['dlc_master'] = master
OUT['dlc_restrictions'] = {int(k): v for k, v in dlc['restrictions'].items()}
off = {}
custom_in_game = []
for q in corpus:
    if q['_src'] == 'event':
        cat = q['quest_id'] // 1000
        # event (60xxx) / episodic (62xxx): official only when the title is on the wiki list; challenge (61xxx) always official
        if cat == 61 or _norm(q['text'][0][0]) in _wiki:
            off[q['quest_id']] = {'en': q['text'][0][0], 'fr': q['text'][1][0], 'map': q['map_id'], 'rank': q['quest_rank'],
                                  'mons': sorted(set(m['monster_id'] for w in q['large_monster_table'] for m in w))}
        else:
            custom_in_game.append(q['quest_id'])
OUT['official_event_quests'] = off

# ---------------------------------------------------------------- loot profiles (rewards auto-fill)
# for every (rank band, hunted monster, reward table): the items of the official quests that hunt this monster,
# averaged (each table of a quest sums to 100 %), with the usual quantity
HUNT_TYPES = (1, 257, 129, 516, 8196, 16388)
def band_of(r):
    return 'low' if r <= 3 else ('high' if r <= 7 else 'g')
def hunted(q):
    out = []
    for o in list(q['objectives']) + [q['objective_sub']]:
        if o['type'] in HUNT_TYPES and o['target_id'] > 0 and o['target_id'] not in out: out.append(o['target_id'])
    return out
acc = {}   # (band, monster|0, table) -> {item: [weight_sum, [qtys]]}, quests
nq = collections.Counter()
for q in corpus:
    if not (q['_src'] == 'base' or q['quest_id'] in off): continue
    b = band_of(q['quest_rank'])
    mons = hunted(q)
    for tk in ('a', 'b', 'c'):
        tabs = q['loot_' + tk]
        if not tabs or not tabs[0]['items']: continue
        its = tabs[0]['items']
        tot = float(sum(i['chance'] for i in its)) or 1.0
        for m in (mons + [0]):          # 0 = any monster (generic profile of the band)
            w = (1.0 / len(mons)) if (m and mons) else 1.0
            key = (b, m, tk)
            d = acc.setdefault(key, {})
            nq[key] += 1
            for i in its:
                e = d.setdefault(i['item_id'], [0.0, []])
                e[0] += w * i['chance'] / tot * 100.0
                e[1].append(i['qty'])
profiles = {}
for (b, m, tk), d in acc.items():
    wsum = sum(e[0] for e in d.values()) or 1.0
    rows = []
    for iid, (w, qtys) in d.items():
        qs = sorted(qtys)
        rows.append([iid, round(w / wsum * 100.0, 2), qs[len(qs) // 2], round(len(qs) / float(nq[(b, m, tk)]), 2)])
    rows.sort(key=lambda r: -r[1])
    profiles.setdefault(b, {}).setdefault(str(m), {})[tk] = {'n': nq[(b, m, tk)], 'items': rows[:30]}
OUT['loot_profiles'] = profiles

# ---------------------------------------------------------------- common values (Zenny, HRP...) by star rank
# what the official quests use, so that a new quest can be compared with them (shown with an asterisk in the editor)
CV_FIELDS = ('fee', 'reward_main', 'reward_reduction', 'reward_sub', 'hrp', 'hrp_reduction', 'hrp_sub')
def _cv(qs):
    out = {}
    for f in CV_FIELDS:
        vals = sorted(q[f] for q in qs)
        # tiny Zenny values are placeholders of special quests, not real rewards
        nz = [v for v in vals if v > (99 if f.startswith(('reward', 'fee')) else 0)]
        if not nz: continue
        cnt = collections.Counter(nz)
        modes = [[v, n] for v, n in sorted(cnt.items(), key=lambda t: (-t[1], t[0]))[:4]]
        out[f] = {'n': len(vals), 'nz': len(nz), 'min': nz[0], 'med': nz[len(nz) // 2], 'max': nz[-1], 'modes': modes}
    return out
_off_q = [q for q in corpus if q['_src'] == 'base' or q['quest_id'] in off]
_off_q = [q for q in _off_q if q['quest_rank'] <= 10 and q['quest_type'] in (1, 2, 3, 4, 8) and q['reward_main'] > 0]
cv = {'star': {}, 'band': {}}
for r in range(1, 11):
    qs = [q for q in _off_q if q['quest_rank'] == r]
    if len(qs) >= 4: cv['star'][str(r)] = _cv(qs)
for b in ('low', 'high', 'g'):
    qs = [q for q in _off_q if band_of(q['quest_rank']) == b]
    if qs: cv['band'][b] = _cv(qs)
OUT['common_values'] = cv

# ---------------------------------------------------------------- supply boxes (auto-fill of the Initial Supplies)
# official quests use 4 boxes: 0 = map items (maps, torches, drinks, one per player), 1 = the standard kit + the counters of the monsters,
# 2 = empty, 3 = the refill box.  Items are repeated once per player: they are stored here as (item, qty, copies).
def _stacks(box):
    out = []
    for e in box:
        if out and out[-1][0] == e['item_id'] and out[-1][1] == e['qty']: out[-1][2] += 1
        else: out.append([e['item_id'], e['qty'], 1])
    return out
sq = []   # (quest, band, map, mons, {box: stacks})
for q in corpus:
    if not (q['_src'] == 'base' or q['quest_id'] in off): continue
    sup = q['supplies']
    if len(sup) < 4 or not sup[1]: continue
    sq.append((q, band_of(q['quest_rank']), q['map_id'], hunted(q), {b: [tuple(x) for x in _stacks(sup[b])] for b in (0, 1, 3)}))
def _freq(counter, n, minf, cap):
    rows = [[k[0], k[1], k[2], round(c / float(n), 2)] for k, c in counter.most_common() if c / float(n) >= minf][:cap]
    return rows
supp = {'map': {}, 'kit': {}, 'mon': {}}
# box 0 by (band, map)
for band in ('low', 'high', 'g'):
    for mp in sorted(set(x[2] for x in sq)):
        grp = [x for x in sq if x[1] == band and x[2] == mp]
        if len(grp) < 2: grp = [x for x in sq if x[2] == mp]
        if len(grp) < 2: continue
        cnt = collections.Counter(st for x in grp for st in set(x[4][0]))
        supp['map'].setdefault(str(mp), {})[band] = {'n': len(grp), 'items': _freq(cnt, len(grp), 0.4, 12)}
# the standard kit of boxes 1 and 3 per band: stacks that more than 55 % of the quests of the band contain
for band in ('low', 'high', 'g'):
    grp = [x for x in sq if x[1] == band]
    if not grp: continue
    kit = {}
    for b in (1, 3):
        cnt = collections.Counter(st for x in grp for st in set(x[4][b]))
        kit[str(b)] = _freq(cnt, len(grp), 0.45, 24)
    supp['kit'][band] = {'n': len(grp), 'boxes': kit}
# monster specific stacks: the ones of box 1 / 3 that are not in the kit of the band, per hunted monster
mon_acc = {}
for q, band, mp, mons, boxes in sq:
    kit1 = set(tuple(r[:3]) for r in supp['kit'][band]['boxes']['1'])
    kit3 = set(tuple(r[:3]) for r in supp['kit'][band]['boxes']['3'])
    for m in mons:
        d = mon_acc.setdefault((m, band), {'n': 0, 1: collections.Counter(), 3: collections.Counter()})
        d['n'] += 1
        for st in set(boxes[1]):
            if st not in kit1: d[1][st] += 1
        for st in set(boxes[3]):
            if st not in kit3: d[3][st] += 1
for (m, band), d in mon_acc.items():
    if d['n'] < 2: continue
    e1 = _freq(d[1], d['n'], 0.34, 6); e3 = _freq(d[3], d['n'], 0.34, 6)
    if e1 or e3: supp['mon'].setdefault(str(m), {})[band] = {'n': d['n'], '1': e1, '3': e3}
OUT['supply_profiles'] = supp

# ---------------------------------------------------------------- requirements (who may post / join) by hunted monster
req_acc = {}
req_star = {}
for q in corpus:
    if not (q['_src'] == 'base' or q['quest_id'] in off): continue
    if q['quest_rank'] > 10 or q['quest_type'] not in (1, 2, 3, 4, 8): continue
    pair = tuple(sorted(q['requirements'], key=lambda v: (v == 0, v)))   # order does not matter, 0 = none goes last
    mons = hunted(q) or sorted(set(m['monster_id'] for w in q['large_monster_table'] for m in w))
    for m in mons:
        req_acc.setdefault((m, band_of(q['quest_rank'])), collections.Counter())[pair] += 1
    req_star.setdefault(q['quest_rank'], collections.Counter())[pair] += 1
reqp = {'mon': {}, 'star': {}}
for (m, band), cn in req_acc.items():
    reqp['mon'].setdefault(str(m), {})[band] = [[list(p), n] for p, n in cn.most_common(6)]
for r, cn in req_star.items():
    reqp['star'][str(r)] = [[list(p), n] for p, n in cn.most_common(6)]
OUT['requirement_profiles'] = reqp

# ---------------------------------------------------------------- objectives (main objectives and subquest) by monster
# what the official quests ask for, per large monster of the quest: used for the proposals of the Objectives tab
obj_main = {}
obj_sub = {}
for q in corpus:
    if not (q['_src'] == 'base' or q['quest_id'] in off): continue
    if q['quest_rank'] > 10 or q['quest_type'] not in (1, 2, 3, 4, 8): continue
    qmons = set(m['monster_id'] for w in q['large_monster_table'] for m in w)
    for o in q['objectives']:
        if o['type'] in (1, 257, 129, 8196, 16388) and o['target_id'] in qmons:
            obj_main.setdefault(o['target_id'], collections.Counter())[(o['type'], o['qty'])] += 1
    sb = q['objective_sub']
    if sb['type'] == 0: continue
    if sb['type'] == 2:
        for m in qmons: obj_sub.setdefault(m, collections.Counter())[(2, sb['target_id'], sb['qty'])] += 1
    elif sb['target_id'] in qmons:
        for m in qmons: obj_sub.setdefault(m, collections.Counter())[(sb['type'], sb['target_id'], sb['qty'])] += 1
OUT['objective_profiles'] = {
    'main': {str(m): [[t, n, c] for (t, n), c in cn.most_common(4)] for m, cn in obj_main.items()},
    'sub': {str(m): [[t, tg, n, c] for (t, tg, n), c in cn.most_common(8)] for m, cn in obj_sub.items()},
}

# ---------------------------------------------------------------- special values usage
sp = collections.defaultdict(lambda: collections.defaultdict(list))
for q in corpus:
    seen = set()
    for w in q['large_monster_table']:
        for m in w: seen.add(('L', m['monster_id'], m['special']))
    for u in q['unstable_monster_table']: seen.add(('L', u['monster']['monster_id'], u['monster']['special']))
    if q['small_monster_table']:
        for g in q['small_monster_table'][0]:
            for m in g: seen.add(('S', m['monster_id'], m['special']))
    for kind, mid, val in seen:
        sp[mid][val].append(q['quest_id'])
special = {}
for mid, d in sp.items():
    special[mid] = {}
    for val, qids in d.items():
        qids = sorted(set(qids))
        special[mid][val] = {'n': len(qids), 'q': [[qid, by_id[qid]['text'][0][0], by_id[qid]['text'][1][0]] for qid in qids[:8]]}
OUT['special_usage'] = special

# ---------------------------------------------------------------- defaults for small monsters (crashflag / special)
cf = collections.defaultdict(collections.Counter)
for q in corpus:
    if not q['small_monster_table']: continue
    for g in q['small_monster_table'][0]:
        for m in g: cf[m['monster_id']][m['crashflag']] += 1
OUT['small_defaults'] = {mid: {'crashflag': c.most_common(1)[0][0]} for mid, c in cf.items()}

# ---------------------------------------------------------------- spawns per map / area
FIELDS = ['monster_id', 'qty', 'condition', 'area', 'crashflag', 'special', 'unk2', 'unk3', 'unk4', 'infection', 'x', 'y', 'z', 'x_rot', 'y_rot', 'z_rot']
def mrec(m):
    r = [m[f] for f in FIELDS]
    for i in (10, 11, 12): r[i] = round(r[i], 1)
    return r
spawns = {}
for q in corpus:
    mp = q['map_id']
    S = spawns.setdefault(mp, {'areas': {}, 'large': {}, 'templates': {}})
    if q['small_monster_table'] and q['small_monster_table'][0]:
        groups = q['small_monster_table'][0]
        flat = [m for g in groups for m in g]
        # per area signature
        per_area = collections.defaultdict(list)
        for m in flat: per_area[m['area']].append(m)
        for a, ms in per_area.items():
            sig = tuple(sorted((m['monster_id']) for m in ms))
            A = S['areas'].setdefault(a, {})
            key = ','.join(map(str, sig))
            if key not in A: A[key] = {'n': 0, 'ranks': [], 'm': [mrec(m) for m in ms], 'q': q['quest_id']}
            A[key]['n'] += 1
            A[key]['ranks'].append(q['quest_rank'])
        # whole-quest template
        tsig = ';'.join(sorted(','.join(map(str, sorted(m['monster_id'] for m in g))) + '@' + str(g[0]['area'] if g else 0) for g in groups))
        T = S['templates']
        if tsig not in T: T[tsig] = {'n': 0, 'q': q['quest_id'], 'en': q['text'][0][0], 'fr': q['text'][1][0], 'rank': q['quest_rank'], 'sm': q['small_meta'], 'groups': [[mrec(m) for m in g] for g in groups]}
        T[tsig]['n'] += 1
    for w in q['large_monster_table']:
        for m in w:
            if m['x'] == 0 and m['y'] == 0 and m['z'] == 0: continue
            L = S['large'].setdefault(m['area'], {})
            key = '%d,%d,%d' % (round(m['x']), round(m['y']), round(m['z']))
            if key not in L: L[key] = {'n': 0, 'p': [round(m['x'], 1), round(m['y'], 1), round(m['z'], 1), m['y_rot']], 'mons': []}
            L[key]['n'] += 1
            if m['monster_id'] not in L[key]['mons']: L[key]['mons'].append(m['monster_id'])
# compact
out_sp = {}
for mp, S in spawns.items():
    areas = {}
    for a, A in S['areas'].items():
        lst = sorted(A.values(), key=lambda v: -v['n'])[:8]
        areas[a] = [{'n': v['n'], 'rmin': min(v['ranks']), 'rmax': max(v['ranks']), 'm': v['m'], 'q': v['q']} for v in lst]
    large = {}
    for a, L in S['large'].items():
        lst = sorted(L.values(), key=lambda v: -v['n'])[:10]
        large[a] = [{'n': v['n'], 'p': v['p'], 'mons': v['mons'][:6]} for v in lst]
    temps = sorted(S['templates'].values(), key=lambda v: (-v['n'], v['rank']))[:14]
    out_sp[mp] = {'areas': areas, 'large': large, 'templates': temps}
OUT['spawns'] = out_sp
smr = collections.defaultdict(list)
for q in corpus:
    if q['small_meta']['hp']: smr[q['quest_rank']].append(q['small_meta'])
OUT['small_meta_by_rank'] = {r: sorted(v, key=lambda m: m['hp'])[len(v)//2] for r, v in smr.items()}
OUT['spawn_fields'] = FIELDS

# ---------------------------------------------------------------- items: categories + monster tags
names = msgs['en_itemName']; fr_names = msgs['fr_itemName']
ALIASES = {}
for mid in range(1, 124):
    if INFO[mid][2] == 'O': continue
    ALIASES.setdefault(K['monsters'][str(mid)].split(' (')[0], mid)
EXTRA = {'G.Jaggi': 15, 'Great Jaggi': 15, 'Kut-Ku': 7, 'Blue Kut-Ku': 8, 'P.Gypceros': 10, 'Purple Gypceros': 10, 'Garuga': 30,
         'Kecha': 20, 'Ash Kecha': 90, 'E.Congalala': 18, 'Gold Rajang': 45, 'G.Rajang': 45, 'Brach': 44, 'R.Brach': 98, 'Raging Brach': 98,
         'S.Magala': 29, 'Daora': 31, 'Steelrust': 82, 'Teostra': 32, 'Fire Dragon': 32, 'M.Tigrex': 80, 'Molten Tigrex': 80,
         'B.Tigrex': 12, 'Brute Tigrex': 12, 'B.Diablos': 100, 'W.Monoblos': 102, 'White Monoblos': 102, 'S.Dalamadur': 110,
         'D.Mohran': 46, "Dah'renMohran": 46, 'Mohran': 46, 'T.Zamtrios': 92, 'B.Tetsucabra': 91, 'T.Najarala': 93,
         'D.Seltas': 94, 'Desert Seltas': 94, 'S.Nerscylla': 96, 'C.Gore Magala': 97, 'Chaotic': 97, 'S.Zinogre': 49,
         'Stygian': 49, 'Savage Jho': 43, 'Jho': 42, 'Plum D.Hermitaur': 108, 'Plum': 108, 'Daimyo': 107, 'Gypceros': 9,
         'Rathian': 1, 'Rathalos': 2, 'Pink Rathian': 3, 'Azure Rathalos': 4, 'Gold Rathian': 5, 'Silver Rathalos': 6,
         'Rath': 2, 'Red Khezu': 37, 'Ruby Basarios': 39, 'Black Gravios': 41, 'Seltas Queen': 26, 'Oroshi Kirin': 35,
         'Dalamadur': 24, 'Gore Magala': 28, 'Shagaru': 29, 'Kushala': 31, 'Akantor': 33, 'Ukanlos': 116, 'Fatalis': 77,
         'Crimson Fatalis': 78, 'White Fatalis': 79, 'Gogmazios': 89, 'Seregios': 88, 'Chameleos': 103, 'Cephalos': 105,
         'Hermitaur': 107, 'Velociprey': 58, 'S.Queen': 26, 'D.S.Queen': 95, 'D.S.QueenConcentrate': 95, 'S.Zin': 49, 'Dalam': 24, 'S.Dalam': 110, 'Rubbery': 9, 'Rubbery Purple': 10, 'Lagombi': 47, 'Kirin': 34, 'Popo': 53, 'Kelbi': 64, 'Gargwa': 50}
ALIASES.update(EXTRA)
alias_list = sorted(ALIASES.items(), key=lambda kv: -len(kv[0]))
OTHER = ['Arzuros', 'Bulldrome', 'Qurupeco', 'Barroth', 'Volvidon', 'Great Baggi', 'Baggi', 'Nibelsnarf', 'Uragaan', 'Wroggi',
         'Duramboros', 'Nargacuga', 'Agnaktor', 'Alatreon', 'Gigginox', 'Barioth', 'Amatsu', 'Jhen', 'Royal Ludroth', 'Plesioth',
         'Lagiacrus', 'Lavasioth', 'Ceadeus', 'Lunastra', 'Lao-Shan', 'Miralis', 'Gobul', 'Vespoid', 'Ceanataur', 'Gaoren',
         'Tsukami', 'I.Lagi', 'A.Lagi', 'L.Nargacuga', 'S.Barioth', 'J.Barroth', 'S.Uragaan', 'G.Plesioth', 'C.Qurupeco']
CATS = [
    ('unused', r'^(dummy|Invalid Message|\(None\)|--------)'),
    ('decoration', r'(Jewel|Jwl)\b|Jwl\d|Jewel\d|\bOrb$|Adamant Orb'),
    ('ammo', r'^(Normal|Pierce|Pellet|Crag|Clust|Flaming|Water|Thunder|Freeze|Dragon|Poison|Para|Sleep|Exhaust|Slicing|Blast|Recover|Demon|Armor|Paint|Tranq) S( Lv\d)?$|Coating|Empty Phial|WyvernFire|Ballista Ammo|Cannon Ammo|Bllsta'),
    ('nectar', r'Nectar'),
    ('book', r'^Book of Combos|Guide$|Vol \d|Vol\d|^(Lynians|Amphibians|Elder Dragons|Temnocerans|Carapaceons|Leviathans)$'),
    ('wystone', r'Wystone'),
    ('charm', r'(?i)(charm|talon)$'),
    ('scrap', r'Scrap\+?$'),
    ('ticket', r'Ticket|Coin|Pass\b|Voucher|Invite|Certificate|Commendation|Accolade|Badge|Seal\b|Stamp|Poster|Newsletter|Zenny|Caravan Points|Melody|Embrace|Grace|Fire$|Keepsake|Memento|Triforce|E-Tank|Catalog|Blueprint|Design Pattern|Weapon Data|Defense Module|Tale of Poogie|Gold Ring|Drum Music|Cheer|Super Mushroom'),
    ('relic', r'Rustshard|Ancient Shard|Rusted Fragment|Ancient Fragment|Battered|Seasoned|Venerable|Champion|Beshackled|Distorted Fragment'),
    ('consumable', r'Potion|Nutrients|Antidote$|Immunizer|Juice|Demondrug|Might Pill|Armorskin|Adamant Pill|Drink|Cleanser|Deodorant|Psychoserum|Herbal Medicine|Catalyst|Lifecrystals|Lifepowder|First-aid|Ration|Dust of Life|Steak|Jerky|Burnt Meat|Chilled Meat|Hot Meat|Mega Nutrients|Max Potion|Cathangea Elixir|Paddock Cream'),
    ('tool', r'Knife|Boomerang|Bomb|Paintball|Dung|Farcaster|Spider Web|\bNet$|Trap|Barrel|Pickaxe|Bug Net|Spit|Whetstone|Binoculars|Horn$|Map$|Torch|Earplugs|Tranquilizer|Ballista Binder|One-shot Binder|Mini Whetstone|Marcoal'),
    ('bait', r'Meat$|Worm|Fishing Fly|Frog|Bait'),
    ('fish', r'(?i)tuna\b|fish\b|Fish$|Tuna|Arowana|Wanchovy|Cutthroat|Goldenfish|Silverfish|Marlin|Mackerel|Bombfish'),
    ('bug', r'(?i)hopper$|glopper$|bug$|Beetle|Hopper|Larva|Godbug|Glopper|Hercudrome|Scarab|Hornfly|Insect Husk|Flutterfly|Rhino|Stag|Dragonfly|Butterfly|Flea|Drone Substance|Queen Substance'),
    ('plant', r'Honey|Herb|Ivy|Sap Plant|Felvine|Gloamgrass|Pepper|Cathangea|Mushroom|shroom|Toadstool|berry|Berry|Seed|Scatternut|Bumblepumpkin|Mistentoe|Acorn|Dragonwood|Dragonmoss|Huskberry|Bone Husk'),
    ('ore', r'(?i)crystal$|Ore$|Crystal|Stone|Firestone|stone$|Abrasive|Spall|Chunk|Powderstone|Sootstone|Coal|Bloodstone|Auristone|Purecrystal|Meteor|Sulfur'),
    ('sphere', r'Sphere'),
    ('generic_material', r'(?i)bone\b|bone$|Relic$|Artifact$|Bone|Sac$|Gem\b|Gem L|Egg|Tear|Extract|Fang$|Claw$|Blood|Guts|Stomach|Liver|Oil|Guano|Treasure|Essence|Pearl|Brains|Skull|Gunpowder|Garbage'),
]
items = {}
for i in range(1, len(names)):
    nm = names[i]
    cat = None
    for c, rx in CATS:
        if re.search(rx, nm):
            cat = c; break
    tags = []
    other = any(o in nm for o in OTHER)
    if not other:
        for al, mid in alias_list:
            if re.search(r'(^|[ .])' + re.escape(al) + r'($|[ +\'.s])', nm) or nm.startswith(al):
                tags.append(mid); break
    if tags or other:
        if cat in (None, 'generic_material', 'consumable', 'tool', 'bait', 'plant', 'ore', 'bug', 'fish', 'scrap') and cat != 'scrap':
            cat = 'monster_material'
    if cat is None:
        cat = 'monster_material' if 300 <= i <= 760 or 1200 <= i <= 1600 or 1734 <= i <= 1812 else 'misc'
    rec = {'c': cat}
    if tags: rec['m'] = tags
    if other: rec['o'] = 1
    if fr_names[i] != nm: rec['fr'] = fr_names[i]
    items[i] = rec
OUT['items'] = items
OUT['item_categories'] = {
    'monster_material': ['Monster materials', 'Matériaux de monstre'], 'generic_material': ['Generic materials (bones, sacs, gems...)', 'Matériaux génériques (os, poches, joyaux...)'],
    'consumable': ['Healing & buffs', 'Soins & bonus'], 'tool': ['Tools, bombs & traps', 'Outils, bombes & pièges'],
    'ammo': ['Ammo & coatings', 'Munitions & enduits'], 'nectar': ['Kinsect nectars', 'Nectars de kinsecte'],
    'plant': ['Plants, mushrooms & berries', 'Plantes, champignons & baies'], 'ore': ['Ores & minerals', 'Minerais'],
    'bug': ['Insects', 'Insectes'], 'fish': ['Fish', 'Poissons'], 'bait': ['Meat & bait', 'Viandes & appâts'],
    'sphere': ['Armor spheres', 'Sphères d\'armure'], 'decoration': ['Decorations (jewels)', 'Joyaux'],
    'charm': ['Charms & talismans', 'Charmes & talismans'], 'relic': ['Relics (rusted / ancient)', 'Reliques'],
    'scrap': ['Palico scraps', 'Rognures de Palico'], 'ticket': ['Tickets, coins & event items', 'Tickets, pièces & objets d\'événement'],
    'book': ['Books & Hunter notes', 'Livres & notes'], 'wystone': ['Wystones', 'Wyvernites'], 'misc': ['Other', 'Divers'],
    'unused': ['Unused (dummy)', 'Inutilisés (dummy)'],
}

# ---------------------------------------------------------------- misc hidden params usage
scen = collections.defaultdict(list)
for q in corpus:
    v = q['raw_quest'][40]
    if v: scen[v].append([q['quest_id'], q['text'][0][0]])
OUT['scenario_usage'] = {k: v[:6] for k, v in scen.items()}
hdr = {'132': collections.defaultdict(list), '136': collections.defaultdict(list)}
for q in corpus:
    for b in ('132', '136'):
        v = q['raw_header'][int(b)]
        if v: hdr[b][v].append([q['quest_id'], q['text'][0][0]])
OUT['header_usage'] = {b: {k: v[:6] for k, v in d.items()} for b, d in hdr.items()}
areas_by_map = collections.defaultdict(set)
for q in corpus:
    for w in q['large_monster_table']:
        for m in w: areas_by_map[q['map_id']].add(m['area'])
    for w in q['small_monster_table'][:1]:
        for g in w:
            for m in g: areas_by_map[q['map_id']].add(m['area'])
OUT['map_areas'] = {k: sorted(v) for k, v in areas_by_map.items()}

# typical stat indices per quest rank (official quests, large monsters)
by = collections.defaultdict(lambda: collections.defaultdict(list))
for q in corpus:
    for m in q['large_meta_table']:
        if not (m['hp'] or m['atk'] or m['break_res']): continue
        for k in ('hp', 'atk', 'break_res', 'stamina', 'status_res'):
            by[q['quest_rank']][k].append(m[k])
def summ(v):
    v = sorted(x for x in v if x <= 140)
    if not v: return None
    return [v[0], v[len(v) // 4], v[len(v) // 2], v[(3 * len(v)) // 4], v[-1]]
OUT['rank_stats'] = {r: {k: summ(v) for k, v in d.items()} for r, d in by.items()}
OUT['map_names_fr'] = {}
OUT['area_images'] = sorted(f[:-7] for f in os.listdir(os.path.join(ROOT, 'source', 'img', 'areas')) if f.endswith('_ID.png'))
with open(args.out, 'w') as f:
    f.write('/* Generated from the MH4U (EU) ROM and the official quests by tools/gamedata/build_data.py - do not edit */\n'
            'window.MH4U_GAMEDATA = ' + json.dumps(OUT, ensure_ascii=True, separators=(',', ':')) + ';\n')
print('written', args.out, os.path.getsize(args.out), 'bytes')
