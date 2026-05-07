#!/usr/bin/env python3
"""Generate all 10 draw.io XML diagrams for Kuwait B2B Hub."""
import os

DIR = '/Users/baderalnoumas/Desktop/B2B/diagrams'
os.makedirs(DIR, exist_ok=True)

# ─── XML primitives ────────────────────────────────────────────────────────────

_ID = [0]
def uid(prefix='c'):
    _ID[0] += 1
    return f'{prefix}{_ID[0]}'

def GEO(x=0, y=0, w=0, h=0, rel=False, pts=None):
    if rel:
        inner = ''
        if pts:
            inner = '<Array as="points">' + ''.join(f'<mxPoint x="{p[0]}" y="{p[1]}"/>' for p in pts) + '</Array>'
        return f'<mxGeometry relative="1" as="geometry">{inner}</mxGeometry>'
    return f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/>'

def XE(s):
    """XML-escape a string for use in an attribute value."""
    return (s.replace('&', '&amp;')
             .replace('"', '&quot;')
             .replace('<', '&lt;')
             .replace('>', '&gt;'))

def V(cid, val, style, x, y, w, h, par='1'):
    return (f'<mxCell id="{cid}" value="{XE(val)}" style="{style}" vertex="1" parent="{par}">'
            f'{GEO(x,y,w,h)}</mxCell>\n')

def E(cid, val, style, src, tgt, par='1', pts=None):
    return (f'<mxCell id="{cid}" value="{XE(val)}" style="{style}" edge="1" '
            f'source="{src}" target="{tgt}" parent="{par}">'
            f'{GEO(rel=True, pts=pts)}</mxCell>\n')

def EL(eid, val, xr, par):
    """Edge label as child cell at relative position xr (-1=src, 0=mid, 1=tgt)."""
    lid = f'{eid}_L{abs(hash(val+str(xr)))%9999}'
    return (f'<mxCell id="{lid}" value="{XE(val)}" '
            f'style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=10;" '
            f'vertex="1" connectable="0" parent="{par}">'
            f'<mxGeometry x="{xr}" relative="1" as="geometry">'
            f'<mxPoint y="15" as="offset"/></mxGeometry></mxCell>\n')

def doc(cells, pw=1654, ph=1169):
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1" '
        f'connect="1" arrows="1" fold="1" page="1" pageScale="1" '
        f'pageWidth="{pw}" pageHeight="{ph}" math="0" shadow="0">'
        '<root><mxCell id="0"/><mxCell id="1" parent="0"/>'
        + cells +
        '</root></mxGraphModel>'
    )

def save(fn, xml):
    with open(os.path.join(DIR, fn), 'w', encoding='utf-8') as f:
        f.write(xml)
    print(f'  ✓ {fn}')

# ─── Palette ───────────────────────────────────────────────────────────────────
BLf,BLs  = '#dae8fc','#6c8ebf'
GRf,GRs  = '#d5e8d4','#82b366'
ORf,ORs  = '#ffe6cc','#d6b656'
PUf,PUs  = '#e1d5e7','#9673a6'
RDf,RDs  = '#f8cecc','#b85450'
YLf,YLs  = '#fff2cc','#d6b656'
GYf,GYs  = '#f5f5f5','#666666'
DKf,DKs  = '#1e4d78','#1a6496'
TLf,TLs  = '#d9ead3','#38761d'
WHf,WHs  = '#ffffff','#333333'
LBf,LBs  = '#cfe2f3','#1155cc'

# ─── Common styles ─────────────────────────────────────────────────────────────
def S_BOX(f,s,r=1):   return f'rounded={r};whiteSpace=wrap;html=1;fillColor={f};strokeColor={s};'
def S_CLS(f,s):       return f'swimlane;fontStyle=1;align=center;startSize=30;fillColor={f};strokeColor={s};rounded=1;arcSize=3;fontSize=12;'
def S_CTR(f,s,bold=1,fs=12): return f'rounded=1;whiteSpace=wrap;html=1;fillColor={f};strokeColor={s};fontStyle={bold};fontSize={fs};align=center;'
def S_ELL(f,s):       return f'ellipse;whiteSpace=wrap;html=1;fillColor={f};strokeColor={s};fontSize=11;fontStyle=0;'
def S_DIM(f,s):       return f'rhombus;whiteSpace=wrap;html=1;fillColor={f};strokeColor={s};fontSize=11;fontStyle=0;'
S_TXT  = 'text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;fontSize=11;overflow=hidden;'
S_CTXT = 'text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;fontSize=12;fontStyle=1;'
S_ARR  = 'endArrow=block;endFill=1;strokeColor=#333333;fontSize=11;'
S_OPEN = 'endArrow=open;endFill=0;strokeColor=#333333;fontSize=11;'
S_DASH = 'endArrow=open;endFill=0;dashed=1;strokeColor=#666666;fontSize=11;'
S_COMP = 'endArrow=block;endFill=1;startArrow=diamondThin;startFill=1;strokeColor=#555555;fontSize=10;'
S_AGG  = 'endArrow=open;endFill=0;startArrow=diamondThin;startFill=0;strokeColor=#333333;fontSize=10;'

# ─── UML Class helper ──────────────────────────────────────────────────────────
SS = 30  # startSize

def CLS(cid, name, attrs, x, y, w, f=BLf, s=BLs):
    h_body = max(len(attrs)*17 + 10, 50)
    total  = SS + h_body
    body   = '<br/>'.join(attrs)
    xml    = V(cid, name, S_CLS(f,s), x, y, w, total)
    xml   += V(f'{cid}_a', body, S_TXT, 0, 0, w, h_body, par=cid)
    return xml, total

# ══════════════════════════════════════════════════════════════════════════════
# 1. CLASS DIAGRAM
# ══════════════════════════════════════════════════════════════════════════════
print('1/10 class_diagram.xml')

def make_class_diagram():
    c = ''
    W = 215

    # Row 1  y=50
    a,_ = CLS('user','User', [
        '+ id: string','+ name: string','+ email: string',
        '- password_hash: string','+ role: Role',
        '+ company_name: string','+ verified: boolean','+ created_at: DateTime'],
        50, 50, W, BLf, BLs)
    c += a

    a,_ = CLS('brand','Brand', [
        '+ id: string','+ owner_id: string','+ name: string',
        '+ status: Status','+ verification_tier: Tier',
        '+ whatsapp: string','+ category: string',
        '+ whatsapp_clicks: int'],
        315, 50, W, GRf, GRs)
    c += a

    a,_ = CLS('brandtrust','BrandTrust', [
        '+ id: string','+ brand_id: string',
        '+ response_rate: number','+ completion_rate: number',
        '+ avg_rating: number','+ trust_score: number'],
        580, 50, W, TLf, TLs)
    c += a

    a,_ = CLS('buyertrust','BuyerTrust', [
        '+ id: string','+ user_id: string',
        '+ total_orders: int','+ completion_rate: number',
        '+ trust_score: number'],
        845, 50, W, TLf, TLs)
    c += a

    # Row 2  y=350
    a,_ = CLS('order','Order', [
        '+ id: string','+ brand_id: string','+ buyer_id: string',
        '+ status: OrderStatus','+ total: number',
        '+ created_at: DateTime'],
        50, 360, W, ORf, ORs)
    c += a

    a,_ = CLS('product','Product', [
        '+ id: string','+ brand_id: string','+ name: string',
        '+ price: number (KWD)','+ moq: int','+ stock: int',
        '+ bulk_pricing_tiers: Tier[]'],
        315, 360, W, GRf, GRs)
    c += a

    a,_ = CLS('review','Review', [
        '+ id: string','+ brand_id: string','+ buyer_id: string',
        '+ order_id: string?','+ rating: int (1–5)',
        '+ content: string (≤300)','+ anonymous: boolean',
        '+ reply: string?'],
        580, 360, W, PUf, PUs)
    c += a

    a,_ = CLS('message','Message', [
        '+ id: string','+ sender_id: string',
        '+ receiver_id: string','+ content: string',
        '+ read: boolean','+ created_at: DateTime'],
        845, 360, W, GYf, GYs)
    c += a

    # Row 3  y=640
    a,_ = CLS('notif','Notification', [
        '+ id: string','+ user_id: string',
        '+ type: string','+ message: string',
        '+ read: boolean','+ created_at: DateTime'],
        50, 640, W, YLf, YLs)
    c += a

    a,_ = CLS('orderitem','OrderItem', [
        '+ id: string','+ order_id: string',
        '+ product_id: string','+ quantity: int',
        '+ unit_price: number'],
        315, 640, W, ORf, ORs)
    c += a

    # ─── Relationships ─────────────────────────────────────────
    def R(eid, src, tgt, sl, tl, style=S_OPEN):
        out = E(eid, '', style, src, tgt)
        if sl: out += EL(eid, sl, -0.85, eid)
        if tl: out += EL(eid, tl,  0.85, eid)
        return out

    c += R('e_ub',   'user',      'brand',     '1',    '0..1')
    c += R('e_bbt',  'brand',     'brandtrust','1',    '1')
    c += R('e_ubyt', 'user',      'buyertrust','1',    '1')
    c += R('e_bp',   'brand',     'product',   '1',    '*',   S_COMP)
    c += R('e_ob',   'order',     'brand',     '*',    '1')
    c += R('e_ou',   'order',     'user',      '*',    '1')
    c += R('e_ooi',  'order',     'orderitem', '1',    '*',   S_COMP)
    c += R('e_oip',  'orderitem', 'product',   '*',    '1')
    c += R('e_rb',   'review',    'brand',     '*',    '1')
    c += R('e_ru',   'review',    'user',      '*',    '1')
    c += R('e_ro',   'review',    'order',     '0..1', '0..1')
    c += R('e_nu',   'notif',     'user',      '*',    '1')
    c += R('e_ms',   'message',   'user',      '* (sender)', '1', S_DASH)

    # Legend
    legend = ('<b>Legend</b><br/>'
              '◆─ Composition<br/>─── Association<br/>- - Dependency')
    c += V('legend', legend, S_BOX(YLf,YLs), 845, 640, 215, 100)

    return doc(c, pw=1120, ph=900)

save('class_diagram.xml', make_class_diagram())

# ══════════════════════════════════════════════════════════════════════════════
# 2. SEQUENCE DIAGRAM — User Registration & Login
# ══════════════════════════════════════════════════════════════════════════════
print('2/10 sequence_registration.xml')

def make_seq_registration():
    c = ''
    # Lifeline positions
    actors = [
        ('act_client',  'Client\n(Browser)',        BLf, BLs,  60),
        ('act_mw',      'Next.js\nMiddleware',       GRf, GRs, 260),
        ('act_api',     'Auth API\n/api/auth/*',     ORf, ORs, 460),
        ('act_db',      'Database\n(Supabase / DB)', RDf, RDs, 660),
    ]
    AW, AH = 160, 60
    LL_TOP = AH + 10   # lifeline starts here
    LL_BOT = 860
    LL_W   = 2

    for aid, name, f, s, x in actors:
        # Actor box
        c += V(aid, name, S_CTR(f, s, bold=1, fs=11), x, 20, AW, AH)
        # Lifeline (vertical dashed line)
        cx = x + AW//2
        c += E(f'll_{aid}', '', 'endArrow=none;dashed=1;strokeColor=#888;',
               f'llt_{aid}', f'llb_{aid}')
        # Anchor points for lifeline endpoints
        c += V(f'llt_{aid}', '', 'point;x=0;y=0;', cx, LL_TOP, 1, 1)
        c += V(f'llb_{aid}', '', 'point;x=0;y=0;', cx, LL_BOT, 1, 1)

    # Helper: draw a message arrow between two lifelines
    def msg(mid, src_actor, tgt_actor, text, y, dashed=False, ret=False):
        sx = [x for a,_,_,_,x in actors if a==src_actor][0] + AW//2
        tx = [x for a,_,_,_,x in actors if a==tgt_actor][0] + AW//2
        arrow = 'endArrow=open;endFill=0;dashed=1;strokeColor=#666;' if (dashed or ret) else 'endArrow=block;endFill=1;strokeColor=#333;'
        c_out = V(f'ms_{mid}', '', 'point;', sx, y, 1, 1)
        c_out += V(f'mt_{mid}', '', 'point;', tx, y, 1, 1)
        c_out += E(f'me_{mid}', text,
                   f'{arrow}fontSize=11;', f'ms_{mid}', f'mt_{mid}')
        return c_out

    # Activation boxes
    def act_box(bid, actor, y_top, h):
        x = [x for a,_,_,_,x in actors if a==actor][0] + AW//2 - 8
        return V(bid, '', S_BOX(BLf, BLs), x, y_top, 16, h)

    c += act_box('ab1', 'act_client',  LL_TOP, 730)
    c += act_box('ab2', 'act_api',     100,    250)
    c += act_box('ab3', 'act_db',      140,    180)

    # Messages — Registration
    c += V('lbl_reg','Registration Flow',
           'text;html=1;fontStyle=3;fontSize=12;fillColor=none;strokeColor=none;', 20, 70, 200, 30)

    c += msg('m1','act_client','act_mw',
             'POST /api/auth/register\n{name, email, password, role, company_name}', 100)
    c += msg('m2','act_mw','act_api','Forward + validate session', 140)
    c += msg('m3','act_api','act_db','SELECT * FROM users WHERE email=?', 170)
    c += msg('m4','act_db','act_api','[ result ]', 200, ret=True)
    c += msg('m5','act_api','act_db','INSERT INTO users (…)', 240)
    c += msg('m6','act_api','act_db','INSERT INTO brands (status=pending)', 270)
    c += msg('m7','act_db','act_api','OK', 300, ret=True)
    c += msg('m8','act_api','act_client','201 Created + Set-Cookie (session)', 340, ret=True)

    # Separator note
    c += V('sep1','', f'endArrow=none;dashed=1;strokeColor={GRs};strokeWidth=2;', 40, 380, 800, 2)
    c += V('lbl_login','Login Flow',
           'text;html=1;fontStyle=3;fontSize=12;fillColor=none;strokeColor=none;', 20, 380, 200, 30)

    # Messages — Login
    c += msg('m9','act_client','act_api','POST /api/auth/login\n{email, password}', 420)
    c += msg('m10','act_api','act_db','SELECT * FROM users WHERE email=?', 460)
    c += msg('m11','act_db','act_api','user record', 490, ret=True)
    c += msg('m12','act_api','act_api','bcrypt.compare(password, hash)', 530)
    c += msg('m13','act_api','act_client','200 OK + Set-Cookie (session, 7-day TTL)', 570, ret=True)

    # Alt fragment for invalid
    c += V('alt1','[invalid credentials]',
           f'{S_BOX(RDf,RDs)}fontSize=11;', 450, 595, 340, 30)
    c += msg('m14','act_api','act_client','401 Unauthorized', 615, ret=True)

    # Messages — Current User check
    c += msg('m15','act_client','act_api','GET /api/auth/me (with cookie)', 670)
    c += msg('m16','act_api','act_db','Validate session token', 700)
    c += msg('m17','act_db','act_api','user profile', 730, ret=True)
    c += msg('m18','act_api','act_client','200 { user: {...} }', 760, ret=True)

    return doc(c, pw=880, ph=900)

save('sequence_registration.xml', make_seq_registration())

# ══════════════════════════════════════════════════════════════════════════════
# 3. SEQUENCE DIAGRAM — Order Lifecycle
# ══════════════════════════════════════════════════════════════════════════════
print('3/10 sequence_order.xml')

def make_seq_order():
    c = ''
    actors = [
        ('ac_buyer',  'Buyer\n(Client)',       BLf, BLs,  50),
        ('ac_api',    'Order API\n/api/orders',ORf, ORs,  270),
        ('ac_db',     'Database',              RDf, RDs,  490),
        ('ac_brand',  'Brand Owner\n(Client)', GRf, GRs,  710),
    ]
    AW, AH = 160, 60
    LL_TOP = AH + 10
    LL_BOT = 960

    for aid, name, f, s, x in actors:
        c += V(aid, name, S_CTR(f, s, 1, 11), x, 20, AW, AH)
        cx = x + AW//2
        c += V(f'llt_{aid}','','point;', cx, LL_TOP, 1, 1)
        c += V(f'llb_{aid}','','point;', cx, LL_BOT, 1, 1)
        c += E(f'll_{aid}','','endArrow=none;dashed=1;strokeColor=#888;',
               f'llt_{aid}', f'llb_{aid}')

    def msg(mid, sa, ta, text, y, ret=False):
        sx = [x for a,_,_,_,x in actors if a==sa][0] + AW//2
        tx = [x for a,_,_,_,x in actors if a==ta][0] + AW//2
        arrow = 'endArrow=open;endFill=0;dashed=1;strokeColor=#666;' if ret else 'endArrow=block;endFill=1;strokeColor=#333;'
        c_out  = V(f'ms_{mid}','','point;',sx,y,1,1)
        c_out += V(f'mt_{mid}','','point;',tx,y,1,1)
        c_out += E(f'me_{mid}',text,f'{arrow}fontSize=11;',f'ms_{mid}',f'mt_{mid}')
        return c_out

    def note(nid, text, x, y, w=200, h=40):
        return V(nid, text, S_BOX(YLf,YLs)+'fontSize=10;', x, y, w, h)

    # Activation boxes
    def ab(bid, ac, yt, h):
        x = [x for a,_,_,_,x in actors if a==ac][0] + AW//2 - 8
        return V(bid,'',S_BOX(ORf,ORs), x, yt, 16, h)

    c += ab('ab1','ac_api', LL_TOP, 780)
    c += ab('ab2','ac_db',  130,    180)

    # Phase: Buyer creates order
    c += V('hdr1','1. Buyer Places Order',
           'text;html=1;fontStyle=3;fontSize=13;fillColor=none;strokeColor=none;', 20, 75, 250, 28)
    c += msg('m1','ac_buyer','ac_api',
             'POST /api/orders\n{ brand_id, items[ {product_id, qty} ] }', 105)
    c += msg('m2','ac_api','ac_db','Fetch products + brand', 140)
    c += msg('m3','ac_db','ac_api','product records', 165, ret=True)
    c += note('n1','Validate: qty ≥ MOQ\n& stock ≥ qty', 820, 165, 180, 50)
    c += msg('m4','ac_api','ac_db','Check MOQ & stock per item', 200)
    c += msg('m5','ac_db','ac_api','OK', 225, ret=True)
    c += msg('m6','ac_api','ac_db','Resolve bulk-pricing tier', 255)
    c += msg('m7','ac_db','ac_api','unit_price resolved', 280, ret=True)
    c += msg('m8','ac_api','ac_db','INSERT Order + OrderItems', 315)
    c += msg('m9','ac_db','ac_api','order_id', 340, ret=True)
    c += msg('m10','ac_api','ac_db','INSERT Notification (brand)', 370)
    c += msg('m11','ac_api','ac_buyer','201 { order }', 405, ret=True)

    # Phase: Brand reviews order
    c += V('hdr2','2. Brand Owner Reviews Order',
           'text;html=1;fontStyle=3;fontSize=13;fillColor=none;strokeColor=none;', 20, 435, 300, 28)
    c += msg('m12','ac_brand','ac_api','GET /api/orders (brand dashboard)', 460)
    c += msg('m13','ac_api','ac_db','SELECT orders WHERE brand_id=?', 490)
    c += msg('m14','ac_db','ac_api','[ order list ]', 515, ret=True)
    c += msg('m15','ac_api','ac_brand','200 [ orders ]', 545, ret=True)
    c += msg('m16','ac_brand','ac_api',
             'PATCH /api/orders/{id}\n{ status: "approved" }', 580)
    c += msg('m17','ac_api','ac_db','UPDATE orders SET status=approved', 615)
    c += msg('m18','ac_api','ac_db','INSERT Notification (buyer)', 645)
    c += msg('m19','ac_api','ac_brand','200 { updated order }', 680, ret=True)

    # Phase: Buyer receives notification
    c += V('hdr3','3. Buyer Receives Update',
           'text;html=1;fontStyle=3;fontSize=13;fillColor=none;strokeColor=none;', 20, 710, 280, 28)
    c += msg('m20','ac_buyer','ac_api','GET /api/notifications', 740)
    c += msg('m21','ac_api','ac_db','SELECT notifications WHERE user_id=?', 770)
    c += msg('m22','ac_db','ac_api','[ notifications ]', 795, ret=True)
    c += msg('m23','ac_api','ac_buyer','200 [ {type:order_approved, ...} ]', 825, ret=True)

    # Order completed
    c += V('hdr4','4. Order Completed',
           'text;html=1;fontStyle=3;fontSize=13;fillColor=none;strokeColor=none;', 20, 855, 250, 28)
    c += msg('m24','ac_brand','ac_api',
             'PATCH /api/orders/{id}\n{ status: "completed" }', 880)
    c += msg('m25','ac_api','ac_db','UPDATE orders SET status=completed', 910)
    c += msg('m26','ac_api','ac_brand','200', 940, ret=True)

    return doc(c, pw=960, ph=1000)

save('sequence_order.xml', make_seq_order())

# ══════════════════════════════════════════════════════════════════════════════
# 4. SEQUENCE DIAGRAM — Brand Verification
# ══════════════════════════════════════════════════════════════════════════════
print('4/10 sequence_brand_verification.xml')

def make_seq_brand_verify():
    c = ''
    actors = [
        ('av_bo',     'Brand Owner\n(Client)',      GRf, GRs,  50),
        ('av_api',    'Register API\n/api/auth',    ORf, ORs,  260),
        ('av_db',     'Database',                   RDf, RDs,  470),
        ('av_admin',  'Admin\n(Client)',             PUf, PUs,  680),
    ]
    AW, AH = 160, 60
    LL_TOP = AH + 10
    LL_BOT = 770

    for aid, name, f, s, x in actors:
        c += V(aid, name, S_CTR(f,s,1,11), x, 20, AW, AH)
        cx = x + AW//2
        c += V(f'llt_{aid}','','point;', cx, LL_TOP, 1,1)
        c += V(f'llb_{aid}','','point;', cx, LL_BOT, 1,1)
        c += E(f'll_{aid}','','endArrow=none;dashed=1;strokeColor=#888;',
               f'llt_{aid}',f'llb_{aid}')

    def msg(mid, sa, ta, text, y, ret=False):
        sx = [x for a,_,_,_,x in actors if a==sa][0] + AW//2
        tx = [x for a,_,_,_,x in actors if a==ta][0] + AW//2
        arrow = 'endArrow=open;endFill=0;dashed=1;strokeColor=#666;' if ret else 'endArrow=block;endFill=1;strokeColor=#333;'
        out  = V(f'ms_{mid}','','point;',sx,y,1,1)
        out += V(f'mt_{mid}','','point;',tx,y,1,1)
        out += E(f'me_{mid}',text,f'{arrow}fontSize=11;',f'ms_{mid}',f'mt_{mid}')
        return out

    # Phase 1: Registration
    c += V('ph1','1. Brand Owner Registers',
           'text;html=1;fontStyle=3;fontSize=13;fillColor=none;strokeColor=none;',20,75,280,28)
    c += msg('m1','av_bo','av_api',
             'POST /api/auth/register\n{ role:"brand_owner", company_name, ... }', 105)
    c += msg('m2','av_api','av_db','INSERT User (role=brand_owner)', 145)
    c += msg('m3','av_api','av_db',
             'INSERT Brand (status=pending, tier=New)', 175)
    c += msg('m4','av_api','av_db','INSERT Notification (admin: new brand)', 205)
    c += msg('m5','av_db','av_api','OK', 235, ret=True)
    c += msg('m6','av_api','av_bo','201 Created → redirect /pending', 265, ret=True)

    # Phase 2: Admin review
    c += V('ph2','2. Admin Reviews Pending Brand',
           'text;html=1;fontStyle=3;fontSize=13;fillColor=none;strokeColor=none;',20,300,300,28)
    c += msg('m7','av_admin','av_api','GET /api/admin/brands?status=pending', 330)
    c += msg('m8','av_api','av_db','SELECT brands WHERE status=pending', 360)
    c += msg('m9','av_db','av_api','[ pending brands ]', 390, ret=True)
    c += msg('m10','av_api','av_admin','200 [ { brand data } ]', 420, ret=True)

    # Alt: Approve
    c += V('alt_hdr','alt [Admin approves]',
           f'{S_BOX(GRf,GRs)}fontSize=11;', 230, 445, 480, 28)
    c += msg('m11','av_admin','av_api',
             'PATCH /api/admin/brands/{id}\n{ status:"approved", verification_tier:"Verified" }', 480)
    c += msg('m12','av_api','av_db',
             'UPDATE brands SET status=approved, tier=Verified', 520)
    c += msg('m13','av_api','av_db','INSERT Notification (brand owner: approved)', 550)
    c += msg('m14','av_db','av_api','OK', 580, ret=True)
    c += msg('m15','av_api','av_admin','200 { updated brand }', 610, ret=True)

    # Phase 3: Brand owner notified
    c += V('ph3','3. Brand Owner Notified',
           'text;html=1;fontStyle=3;fontSize=13;fillColor=none;strokeColor=none;',20,645,280,28)
    c += msg('m16','av_bo','av_api','GET /api/notifications', 670)
    c += msg('m17','av_api','av_db','SELECT notifications WHERE user_id=?', 695)
    c += msg('m18','av_db','av_api','[ {type:brand_approved} ]', 720, ret=True)
    c += msg('m19','av_api','av_bo','200 [ notification ] → brand now visible', 748, ret=True)

    return doc(c, pw=910, ph=810)

save('sequence_brand_verification.xml', make_seq_brand_verify())

# ══════════════════════════════════════════════════════════════════════════════
# 5. DFD LEVEL 0 — Context Diagram
# ══════════════════════════════════════════════════════════════════════════════
print('5/10 dfd_level0.xml')

def make_dfd_level0():
    c = ''
    # System boundary rectangle
    c += V('sys','Kuwait B2B Hub\nPlatform',
           f'rounded=1;whiteSpace=wrap;html=1;fillColor={BLf};strokeColor={BLs};'
           f'fontStyle=1;fontSize=18;strokeWidth=3;', 340, 260, 360, 140)

    # External entities
    EE_ST = f'rounded=0;whiteSpace=wrap;html=1;fillColor={GYf};strokeColor={GYs};fontStyle=1;fontSize=13;'
    c += V('ee_admin','Admin User',    EE_ST,  80,  60, 160, 60)
    c += V('ee_brand','Brand Owner',   EE_ST, 800,  60, 160, 60)
    c += V('ee_buyer','Business Buyer',EE_ST,  80, 560, 160, 60)
    c += V('ee_ext',  'External Services\n(WhatsApp)',EE_ST, 800,560,160,60)

    # Data flows
    FA = 'endArrow=block;endFill=1;strokeColor=#333;fontSize=11;'
    FB = 'endArrow=block;endFill=1;strokeColor=#333;fontSize=11;startArrow=block;startFill=1;'

    # Admin ↔ System
    c += E('f1','Brand approvals\nUser management\nReview moderation',
           FA, 'ee_admin','sys')
    c += E('f2','Platform reports\nPending notifications',
           FA+'dashed=1;', 'sys','ee_admin')

    # Brand Owner ↔ System
    c += E('f3','Product catalog\nOrder responses\nBrand profile',
           FA, 'ee_brand','sys')
    c += E('f4','Order notifications\nBuyer reviews\nRevenue dashboard',
           FA+'dashed=1;', 'sys','ee_brand')

    # Buyer ↔ System
    c += E('f5','Search queries\nOrder requests\nReviews & ratings',
           FA, 'ee_buyer','sys')
    c += E('f6','Brand catalogs\nOrder status\nIn-app notifications',
           FA+'dashed=1;', 'sys','ee_buyer')

    # External services
    c += E('f7','WhatsApp click events',FA, 'sys','ee_ext')

    # Title
    c += V('title','Level-0 Context Diagram — Kuwait B2B Hub',
           'text;html=1;fontStyle=1;fontSize=16;align=center;fillColor=none;strokeColor=none;',
           200, 10, 660, 40)

    # Legend
    c += V('leg_a','── Inbound data flow',
           f'text;html=1;fontSize=11;fillColor=none;strokeColor=none;', 20, 680, 200,20)
    c += V('leg_b','- - Outbound data flow',
           f'text;html=1;fontSize=11;fillColor=none;strokeColor=none;', 20, 700, 200,20)

    return doc(c, pw=1060, ph=760)

save('dfd_level0.xml', make_dfd_level0())

# ══════════════════════════════════════════════════════════════════════════════
# 6. DFD LEVEL 1
# ══════════════════════════════════════════════════════════════════════════════
print('6/10 dfd_level1.xml')

def make_dfd_level1():
    c = ''
    # Title
    c += V('title','Level-1 Data Flow Diagram — Kuwait B2B Hub',
           'text;html=1;fontStyle=1;fontSize=16;align=center;fillColor=none;strokeColor=none;',
           100, 10, 900, 38)

    # External entities
    EE = f'rounded=0;whiteSpace=wrap;html=1;fillColor={GYf};strokeColor={GYs};fontStyle=1;fontSize=12;'
    c += V('ee_adm','Admin User',     EE,  30,  80, 140, 55)
    c += V('ee_bro','Brand Owner',    EE, 880,  80, 140, 55)
    c += V('ee_buy','Business Buyer', EE,  30, 560, 140, 55)
    c += V('ee_ext','WhatsApp',       EE, 880, 560, 140, 55)

    # Processes (ellipses)
    PE = lambda f,s: f'ellipse;whiteSpace=wrap;html=1;fillColor={f};strokeColor={s};fontStyle=1;fontSize=12;'
    c += V('p1','P1\nAuth &\nSessions',      PE(BLf,BLs), 220, 100, 150, 100)
    c += V('p2','P2\nCatalog\nManagement',   PE(GRf,GRs), 580, 100, 150, 100)
    c += V('p3','P3\nOrder\nProcessing',     PE(ORf,ORs), 400, 350, 150, 100)
    c += V('p4','P4\nTrust &\nReviews',      PE(PUf,PUs), 220, 560, 150, 100)
    c += V('p5','P5\nAdmin &\nNotifications',PE(RDf,RDs), 580, 560, 150, 100)

    # Data stores (open-ended rectangles)
    DS = f'shape=mxgraph.dfd.dataStore;whiteSpace=wrap;html=1;fillColor={YLf};strokeColor={YLs};fontSize=12;fontStyle=1;'
    DS_ALT = f'rounded=0;whiteSpace=wrap;html=1;fillColor={YLf};strokeColor={YLs};fontSize=12;fontStyle=1;'
    c += V('d1','D1 Users',            DS_ALT,  30, 290, 150, 45)
    c += V('d2','D2 Brands / Products',DS_ALT, 880, 290, 150, 45)
    c += V('d3','D3 Orders / Items',   DS_ALT,  30, 420, 150, 45)
    c += V('d4','D4 Reviews / Notifs', DS_ALT, 880, 420, 150, 45)

    F = 'endArrow=block;endFill=1;strokeColor=#444;fontSize=10;'
    FR= 'endArrow=block;endFill=1;strokeColor=#444;fontSize=10;dashed=1;'

    # External → Processes
    c += E('ef1','credentials',    F, 'ee_buy','p1')
    c += E('ef2','register/login', F, 'ee_bro','p1')
    c += E('ef3','product data',   F, 'ee_bro','p2')
    c += E('ef4','search query',   F, 'ee_buy','p3')
    c += E('ef5','review + rating',F, 'ee_buy','p4')
    c += E('ef6','brand decisions',F, 'ee_adm','p5')

    # Processes → Data stores
    c += E('pd1','read/write user',  F, 'p1','d1')
    c += E('pd2','read/write brand', F, 'p2','d2')
    c += E('pd3','read/write orders',F, 'p3','d3')
    c += E('pd4','read/write reviews',F,'p4','d4')
    c += E('pd5','send notifs',      F, 'p5','d4')

    # Cross-process flows
    c += E('cp1','session token',    F, 'p1','p3')
    c += E('cp2','product catalog',  F, 'p2','p3')
    c += E('cp3','order confirmed',  F, 'p3','p5')
    c += E('cp4','trust score',      F, 'p4','p5')

    # Processes → External
    c += E('pe1','session cookie',FR, 'p1','ee_buy')
    c += E('pe2','order status',  FR, 'p3','ee_buy')
    c += E('pe3','notifications', FR, 'p5','ee_bro')
    c += E('pe4','WA click event',FR, 'p3','ee_ext')
    c += E('pe5','reports',       FR, 'p5','ee_adm')

    return doc(c, pw=1100, ph=730)

save('dfd_level1.xml', make_dfd_level1())

# ══════════════════════════════════════════════════════════════════════════════
# 7. ACTIVITY DIAGRAM — Order Placement
# ══════════════════════════════════════════════════════════════════════════════
print('7/10 activity_order.xml')

def make_activity_order():
    c = ''
    cx = 320  # center x
    W_ACT = 260; H_ACT = 50
    W_DEC = 180; H_DEC = 60
    Y = 50   # running y

    def act(aid, text, y, f=BLf, s=BLs):
        x = cx - W_ACT//2
        return V(aid, text, f'rounded=1;whiteSpace=wrap;html=1;fillColor={f};strokeColor={s};fontSize=12;', x, y, W_ACT, H_ACT)

    def dec(did, text, y):
        x = cx - W_DEC//2
        return V(did, text, S_DIM(YLf,YLs), x, y, W_DEC, H_DEC)

    def arr(aid, src, tgt, label=''):
        return E(aid, label, S_ARR, src, tgt)

    def fork_join(fid, y, label=''):
        return V(fid, label, f'rounded=0;fillColor=#333;strokeColor=#333;fontSize=11;', cx-100, y, 200, 10)

    # Start
    c += V('start','','ellipse;fillColor=#000000;strokeColor=#000000;', cx-20, Y, 40, 40)
    Y += 60

    # Activity 1
    c += act('a1','Buyer Browses Marketplace\n& Selects Brand', Y); Y += H_ACT
    c += arr('e_start_a1','start','a1')

    c += arr('e1','a1','a2')
    c += act('a2','Buyer Views Product Details\n& Pricing Tiers', Y:=Y+20); Y += H_ACT

    c += arr('e2','a2','a3')
    c += act('a3','Buyer Enters Quantity', Y:=Y+20); Y += H_ACT

    c += arr('e3','a3','d1')
    # Decision 1: qty >= MOQ?
    c += dec('d1','qty ≥ MOQ?', Y:=Y+20); Y += H_DEC

    # No branch
    c += act('a_err1','Show MOQ Error\n(qty must be ≥ MOQ)', Y:=Y+20, f=RDf, s=RDs)
    c += arr('e_d1_no','d1','a_err1','No')
    c += E('e_err1_back','return','endArrow=open;endFill=0;strokeColor=#b85450;dashed=1;fontSize=10;',
           'a_err1','a3')

    # Yes branch
    c += arr('e_d1_yes','d1','d2','Yes')
    # Decision 2: stock >= qty?
    c += dec('d2','Stock\nsufficient?', Y:=Y+20+H_ACT); Y += H_DEC

    c += act('a_err2','Show Stock Error\n(insufficient stock)', Y:=Y+20, f=RDf, s=RDs)
    c += arr('e_d2_no','d2','a_err2','No')
    c += E('e_err2_back','return','endArrow=open;endFill=0;strokeColor=#b85450;dashed=1;fontSize=10;',
           'a_err2','a3')

    c += arr('e_d2_yes','d2','a4','Yes')
    c += act('a4','Resolve Bulk-Pricing Tier\n& Compute Total', Y:=Y+20+H_ACT); Y += H_ACT

    c += arr('e4','a4','a5')
    c += act('a5','Buyer Confirms & Submits Order', Y:=Y+20); Y += H_ACT

    c += arr('e5','a5','a6')
    c += act('a6','POST /api/orders — Create Order\n& OrderItems in DB', Y:=Y+20, f=GRf, s=GRs)
    Y += H_ACT

    c += arr('e6','a6','a7')
    c += act('a7','Notify Brand Owner\n(createNotification)', Y:=Y+20, f=PUf, s=PUs)
    Y += H_ACT

    c += arr('e7','a7','a8')
    c += act('a8','Return 201 Created\n{ order_id, total, status:pending }', Y:=Y+20, f=TLf, s=TLs)
    Y += H_ACT

    # End
    c += arr('e8','a8','end_inner')
    c += V('end_inner','','ellipse;fillColor=#000000;strokeColor=#000000;',cx-15,Y+20,30,30)
    c += V('end_outer','','ellipse;fillColor=none;strokeColor=#000000;strokeWidth=3;',cx-21,Y+14,42,42)

    # Swim lane label
    c += V('swim_lbl','Order Placement Activity Diagram',
           'text;html=1;fontStyle=1;fontSize=16;align=center;fillColor=none;strokeColor=none;',
           50,10,500,32)

    return doc(c, pw=740, ph=Y+100)

save('activity_order.xml', make_activity_order())

# ══════════════════════════════════════════════════════════════════════════════
# 8. DEPLOYMENT DIAGRAM
# ══════════════════════════════════════════════════════════════════════════════
print('8/10 deployment_diagram.xml')

def make_deployment():
    c = ''
    c += V('title','Physical Deployment Diagram — Kuwait B2B Hub',
           'text;html=1;fontStyle=1;fontSize=16;align=center;fillColor=none;strokeColor=none;',
           80,10,1000,38)

    # Node style: 3D-ish box
    def node(nid, label, x, y, w, h, f, s):
        return V(nid, label, (f'rounded=1;whiteSpace=wrap;html=1;fillColor={f};strokeColor={s};'
                               f'fontStyle=1;fontSize=13;verticalAlign=top;arcSize=5;'
                               f'strokeWidth=2;'), x, y, w, h)

    def comp(cid, label, x, y, w, h, f, s):
        return V(cid, label, (f'rounded=1;whiteSpace=wrap;html=1;fillColor={f};strokeColor={s};'
                               f'fontSize=11;'), x, y, w, h)

    # ── Node 1: User Device ──────────────────────────────────────
    c += node('nd_client','<<device>>\nUser Device\n(Desktop / Mobile Browser)',
              40, 80, 220, 120, '#e8f4fd','#2980b9')
    c += comp('cp_browser','Chrome / Safari / Firefox\n(React 19, CSS Modules, next-intl)',
              60,170,180,70,'#d6eaf8','#2980b9')

    # ── Node 2: Vercel Edge Network ────────────────────────────
    c += node('nd_vercel','<<cloud node>>\nVercel Edge Network',
              360,60,420,320, BLf, BLs)
    c += comp('cp_cdn','CDN — Static Assets\n(JS bundles, images, SVG)',
              380,140,180,60, '#b8d4f0','#3d7ab5')
    c += comp('cp_ssr','Next.js SSR\n(React Server Components\nApp Router / pages)',
              380,220,180,70,'#b8d4f0','#3d7ab5')
    c += comp('cp_api','Next.js Route Handlers\n/api/** — REST JSON API\n(Supabase SSR middleware)',
              380,310,180,70,'#b8d4f0','#3d7ab5')
    # Middleware box
    c += comp('cp_mw','SSR Middleware\n(session refresh, role guard)',
              580,140,180,60,'#cfe2f3','#3d7ab5')

    # ── Node 3: Supabase Cloud ─────────────────────────────────
    c += node('nd_supa','<<cloud node>>\nSupabase Cloud\n(GCC-adjacent region)',
              900,60,260,320, GRf, GRs)
    c += comp('cp_auth','Supabase Auth\n(bcrypt, JWT, SSR cookies)',
              920,140,220,70, TLf, TLs)
    c += comp('cp_pg','PostgreSQL DB\n(brands, products, orders,\nreviews, notifications)',
              920,230,220,80, TLf, TLs)
    c += comp('cp_rt','Realtime Engine\n(WebSocket subscriptions)',
              920,330,220,50, TLf, TLs)

    # ── Node 4: External WhatsApp ──────────────────────────────
    c += node('nd_wa','<<external>>\nWhatsApp Business',
              360, 460, 200, 80, GYf, GYs)

    # Communication lines
    HTTPS = 'endArrow=block;endFill=1;strokeColor=#333;strokeWidth=2;fontSize=11;'
    PSQL  = 'endArrow=block;endFill=1;strokeColor=#38761d;strokeWidth=2;fontSize=11;'
    DEEP  = 'endArrow=open;endFill=0;dashed=1;strokeColor=#666;strokeWidth=1;fontSize=10;'

    c += E('l1','HTTPS / TLS 1.3',        HTTPS, 'nd_client','nd_vercel')
    c += E('l2','Supabase Auth (HTTPS)',   PSQL,  'nd_vercel','nd_supa')
    c += E('l3','PostgreSQL (TLS)',        PSQL,  'cp_api',   'cp_pg')
    c += E('l4','JWT validation',          PSQL,  'cp_api',   'cp_auth')
    c += E('l5','Realtime WebSocket',      PSQL,  'cp_ssr',   'cp_rt')
    c += E('l6','deep-link redirect',      DEEP,  'nd_vercel','nd_wa')

    # Protocol labels
    c += V('prot_https','HTTPS',
           'text;html=1;fontSize=10;fillColor=none;strokeColor=none;fontStyle=3;', 270, 200, 80, 20)
    c += V('prot_pg','TLS/PSQL',
           'text;html=1;fontSize=10;fillColor=none;strokeColor=none;fontStyle=3;', 800, 200, 80, 20)

    return doc(c, pw=1260, ph=600)

save('deployment_diagram.xml', make_deployment())

# ══════════════════════════════════════════════════════════════════════════════
# 9. GANTT CHART — 8 Sprints Jan–Jun 2026
# ══════════════════════════════════════════════════════════════════════════════
print('9/10 gantt_chart.xml')

def make_gantt():
    c = ''
    # Layout constants
    LEFT = 200   # label column width
    TOP  = 80    # header row height
    RH   = 45    # row height
    TW   = 80    # width per 2-week block
    COLS = 12    # 12 × 2-week blocks = 6 months
    W    = LEFT + COLS * TW
    H    = TOP + 8 * RH + 60

    # Title
    c += V('title','Project Gantt Chart — Kuwait B2B Hub (Jan–Jun 2026)',
           'text;html=1;fontStyle=1;fontSize=16;align=center;fillColor=none;strokeColor=none;',
           0, 10, W, 38)

    # Header background
    c += V('hdr_bg','',f'fillColor={DKf};strokeColor={DKs};', 0, TOP, W, 40)

    # Month labels
    months = ['January','February','March','April','May','June']
    for i, m in enumerate(months):
        x = LEFT + i * 2 * TW
        c += V(f'mhdr_{i}', m,
               f'fillColor={DKf};strokeColor={DKs};fontColor=#ffffff;fontStyle=1;fontSize=12;'
               f'align=center;', x, TOP, 2*TW, 40)

    # Label column header
    c += V('lhdr','Sprint / Task',
           f'fillColor={DKf};strokeColor={DKs};fontColor=#ffffff;fontStyle=1;fontSize=12;'
           f'align=center;', 0, TOP, LEFT, 40)

    # Sprint data: (name, start_col, end_col, fill, stroke)
    # Each 2-week block = TW pixels; col 0 = Jan 1–14
    sprints = [
        ('Sprint 1\nAuth & Setup',         0,  1,  BLf, BLs),
        ('Sprint 2\nMarketplace',           2,  3,  GRf, GRs),
        ('Sprint 3\nOrder Lifecycle',       4,  6,  ORf, ORs),
        ('Sprint 4\nBrand Owner Tools',     6,  8,  PUf, PUs),
        ('Sprint 5\nTrust & Reputation',    8,  9,  TLf, TLs),
        ('Sprint 6\nAdmin & Notifs',        9, 11,  RDf, RDs),
        ('Sprint 7\nLocalisation & Mobile', 10, 12, YLf, YLs),
        ('Sprint 8\nMigration & Report',    12, 16, LBf, LBs),
    ]
    # Sprint 7 overlaps Sprint 6 slightly, Sprint 8 is May–June (cols 8-11 in 2-week blocks)
    # Let me recalculate to fit Jan–Jun:
    # Jan: cols 0,1 (0-13, 14-31)
    # Feb: cols 2,3
    # Mar: cols 4,5
    # Apr: cols 6,7
    # May: cols 8,9
    # Jun: cols 10,11
    sprints = [
        ('Sprint 1\nAuth & Setup',                0,  2,  BLf, BLs),   # Jan 1-14 (1 blk)
        ('Sprint 2\nMarketplace',                  2,  4,  GRf, GRs),   # Jan 15-31 (1 blk)
        ('Sprint 3\nOrder Lifecycle',              4,  7,  ORf, ORs),   # Feb 1-20 (1.5 blk)
        ('Sprint 4\nBrand Owner Tools',            7,  9,  PUf, PUs),   # Feb 21-Mar 9
        ('Sprint 5\nTrust & Reputation',           9, 11,  TLf, TLs),   # Mar 10-24
        ('Sprint 6\nAdmin & Notifications',        11, 13, RDf, RDs),   # Mar 25-Apr 9
        ('Sprint 7\nLocalisation & Mobile',        13, 17, YLf, YLs),   # Apr 10-Apr 30
        ('Sprint 8\nMigration, Testing & Report',  17, 24, LBf, LBs),   # May 1-Jun 15
    ]

    # Scale: 24 half-blocks, each = TW/2 = 40px
    HB = TW // 2   # half-block width = 40px
    COLS2 = 24     # 24 half-blocks = 12 months...
    # Recalculate: 6 months = 26 weeks ≈ 13 two-week blocks
    # Jan: blk 0,1 | Feb: blk 2,3 | Mar: blk 4,5 | Apr: blk 6,7 | May: blk 8,9 | Jun: blk 10,11,12
    # Use 13 blocks, TW=70
    TW = 70; COLS = 13; W = LEFT + COLS * TW

    sprints = [
        ('Sprint 1 — Auth & Setup',                0,  1,  BLf, BLs),
        ('Sprint 2 — Marketplace',                  1,  2,  GRf, GRs),
        ('Sprint 3 — Order Lifecycle',              2,  3.5,ORf, ORs),
        ('Sprint 4 — Brand Owner Tools',            3.5,5,  PUf, PUs),
        ('Sprint 5 — Trust & Reputation',           5,  6,  TLf, TLs),
        ('Sprint 6 — Admin & Notifications',        6,  7,  RDf, RDs),
        ('Sprint 7 — Localisation & Mobile',        7,  8.5,YLf, YLs),
        ('Sprint 8 — Migration, Testing & Report',  8.5,13, LBf, LBs),
    ]

    # Month header: Jan=0-2 blocks, Feb=2-4, Mar=4-6, Apr=6-8, May=8-10.5, Jun=10.5-13
    months_spans = [
        ('January',  0, 2),
        ('February', 2, 4),
        ('March',    4, 6),
        ('April',    6, 8),
        ('May',      8, 10.5),
        ('June',     10.5, 13),
    ]

    # Redraw month headers with new scale
    for i, (m, blk_s, blk_e) in enumerate(months_spans):
        x = LEFT + blk_s * TW
        w = (blk_e - blk_s) * TW
        c += V(f'mhdr_{i}', m,
               f'fillColor={DKf};strokeColor={DKs};fontColor=#ffffff;fontStyle=1;fontSize=11;'
               f'align=center;', x, TOP, w, 40)

    # Background grid
    for col in range(COLS + 1):
        x = LEFT + col * TW
        c += V(f'grid_v_{col}','',
               f'fillColor=none;strokeColor=#cccccc;strokeWidth=1;',
               x, TOP, 1, 8 * RH)

    # Sprint rows
    for row, (name, blk_s, blk_e, fill, stroke) in enumerate(sprints):
        y = TOP + 40 + row * RH
        # Row background
        bg = WHf if row % 2 == 0 else GYf
        c += V(f'row_bg_{row}','',f'fillColor={bg};strokeColor={GYs};', 0, y, W, RH)
        # Label
        c += V(f'row_lbl_{row}', name,
               f'fillColor={bg};strokeColor={GYs};align=left;spacingLeft=6;fontSize=10;fontStyle=1;',
               0, y, LEFT, RH)
        # Bar
        x_bar = LEFT + blk_s * TW
        w_bar = (blk_e - blk_s) * TW
        c += V(f'bar_{row}', '',
               f'rounded=1;fillColor={fill};strokeColor={stroke};', x_bar, y + 8, w_bar, RH - 16)

    # Bottom axis
    y_axis = TOP + 40 + 8 * RH
    c += V('axis_line','',f'fillColor={DKf};strokeColor={DKs};', 0, y_axis, W, 4)

    # Milestones (diamonds)
    milestones = [
        ('M-02 Auth',  1,  0), ('M-03 Market',   2,  1),
        ('M-04 Orders',3.5,2), ('M-05 Trust',    6,  4),
        ('M-06 Admin', 7,  5), ('M-08 Progress', 7.5, 6),
        ('M-12 Report',13, 7),
    ]
    for mlbl, col, row_hint in milestones:
        mx = LEFT + col * TW - 8
        my = TOP + 40 + row_hint * RH + RH//2 - 8
        c += V(f'ms_{mlbl}','',
               f'rhombus;fillColor={DKf};strokeColor=#ffffff;strokeWidth=2;',
               mx, my, 16, 16)

    # Legend row
    leg_y = TOP + 40 + 8 * RH + 15
    c += V('leg_bar','Sprint Bar',
           f'rounded=1;fillColor={BLf};strokeColor={BLs};fontSize=10;', LEFT, leg_y, 100, 25)
    c += V('leg_ms','',
           f'rhombus;fillColor={DKf};strokeColor={DKs};fontSize=10;',
           LEFT + 120, leg_y + 4, 18, 18)
    c += V('leg_ms_txt','Milestone',
           'text;fontSize=10;fillColor=none;strokeColor=none;',
           LEFT + 144, leg_y + 5, 80, 18)

    return doc(c, pw=W + 20, ph=H + 20)

save('gantt_chart.xml', make_gantt())

# ══════════════════════════════════════════════════════════════════════════════
# 10. FISHBONE (ISHIKAWA) DIAGRAM
# ══════════════════════════════════════════════════════════════════════════════
print('10/10 fishbone_diagram.xml')

def make_fishbone():
    c = ''
    # Main effect box
    EX, EY, EW, EH = 900, 280, 240, 80
    ECX = EX + EW//2
    ECY = EY + EH//2
    SPINE_X2 = EX  # spine ends at effect box left edge
    SPINE_X1 = 100
    SPINE_Y  = ECY

    c += V('title','Ishikawa (Fishbone) Diagram — Root Cause: Delayed Final Submission',
           'text;html=1;fontStyle=1;fontSize=15;align=center;fillColor=none;strokeColor=none;',
           50, 10, 1100, 38)

    # Effect box
    c += V('effect', 'EFFECT\nDelayed Final\nSubmission',
           f'rounded=1;whiteSpace=wrap;html=1;fillColor={RDf};strokeColor={RDs};'
           f'fontStyle=1;fontSize=13;', EX, EY, EW, EH)

    # Main spine
    c += E('spine','','endArrow=block;endFill=1;strokeColor=#333;strokeWidth=3;',
           'spine_start','effect')
    c += V('spine_start','','point;', SPINE_X1, SPINE_Y, 1, 1)

    # Five bones: top (even bones) and bottom (odd bones)
    # Top: People (x=220), Process (x=440), Technology (x=660)
    # Bottom: Environment (x=330), Materials (x=550)
    bones_top = [
        ('People',      240, [
            'Team member unavailability',
            'Knowledge silos / skill gaps',
            'Communication breakdowns',
            'Unclear responsibility boundaries',
        ]),
        ('Process',     460, [
            'Scope creep in Sprint 8',
            'Insufficient sprint planning',
            'Unclear acceptance criteria',
            'Missing iterative reviews',
        ]),
        ('Technology',  680, [
            'Supabase migration complexity',
            'Dependency version conflicts',
            'Build toolchain issues',
            'Auth migration risk',
        ]),
    ]
    bones_bot = [
        ('Environment', 350, [
            'Platform / CI outages',
            'Local dev environment issues',
            'Internet connectivity failures',
        ]),
        ('Materials',   570, [
            'Incomplete requirements docs',
            'Missing design artefacts',
            'Late diagram production',
            'Unfinished report sections',
        ]),
    ]

    def bone_top(bid, label, bx, causes):
        """Diagonal bone going from spine up-left to label."""
        bone_y_tip = SPINE_Y - 140
        # Bone start on spine
        c_out  = V(f'bs_{bid}','','point;', bx, SPINE_Y, 1,1)
        # Bone label box
        c_out += V(f'bl_{bid}', label,
                   f'rounded=1;whiteSpace=wrap;html=1;fillColor={DKf};strokeColor={DKs};'
                   f'fontColor=#ffffff;fontStyle=1;fontSize=12;align=center;',
                   bx - 80, bone_y_tip - 30, 160, 40)
        # Bone line
        c_out += E(f'be_{bid}','','endArrow=none;strokeColor=#555;strokeWidth=2;',
                   f'bl_{bid}', f'bs_{bid}')
        # Sub-causes
        for i, cause in enumerate(causes):
            cx2 = bx - 60 - i*5
            cy2 = bone_y_tip + 20 + i * 35
            c_out += V(f'sc_{bid}_{i}', cause,
                       f'text;html=1;align=right;fontSize=10;fillColor=none;strokeColor=none;',
                       cx2 - 180, cy2 - 12, 180, 24)
            c_out += V(f'scp_{bid}_{i}','','point;', cx2, cy2, 1, 1)
            c_out += E(f'sce_{bid}_{i}','',
                       'endArrow=open;endFill=0;strokeColor=#999;strokeWidth=1;',
                       f'scp_{bid}_{i}', f'bs_{bid}')
        return c_out

    def bone_bot(bid, label, bx, causes):
        """Diagonal bone going from spine down-left to label."""
        bone_y_tip = SPINE_Y + 140
        c_out  = V(f'bs_{bid}','','point;', bx, SPINE_Y, 1,1)
        c_out += V(f'bl_{bid}', label,
                   f'rounded=1;whiteSpace=wrap;html=1;fillColor={DKf};strokeColor={DKs};'
                   f'fontColor=#ffffff;fontStyle=1;fontSize=12;align=center;',
                   bx - 80, bone_y_tip, 160, 40)
        c_out += E(f'be_{bid}','','endArrow=none;strokeColor=#555;strokeWidth=2;',
                   f'bl_{bid}', f'bs_{bid}')
        for i, cause in enumerate(causes):
            cx2 = bx - 60 - i*5
            cy2 = bone_y_tip - 15 - i * 35
            c_out += V(f'sc_{bid}_{i}', cause,
                       f'text;html=1;align=right;fontSize=10;fillColor=none;strokeColor=none;',
                       cx2 - 180, cy2 - 12, 180, 24)
            c_out += V(f'scp_{bid}_{i}','','point;', cx2, cy2, 1,1)
            c_out += E(f'sce_{bid}_{i}','',
                       'endArrow=open;endFill=0;strokeColor=#999;strokeWidth=1;',
                       f'scp_{bid}_{i}', f'bs_{bid}')
        return c_out

    for bid, bx, causes in bones_top:
        c += bone_top(bid, bid, bx, causes)
    for bid, bx, causes in bones_bot:
        c += bone_bot(bid, bid, bx, causes)

    return doc(c, pw=1200, ph=700)

save('fishbone_diagram.xml', make_fishbone())

# ──────────────────────────────────────────────────────────────────────────────
print()
print(f'All 10 diagrams saved to: {DIR}')
