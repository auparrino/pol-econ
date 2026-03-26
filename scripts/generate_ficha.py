"""Generate PoliticDash 2-page A4 portfolio PDF."""
import os
import qrcode
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from PIL import Image

# Paths
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(BASE, 'fonts')
SHOTS = os.path.join(BASE, 'screenshots_ficha')
OUT = os.path.join(BASE, 'PoliticDash_Ficha_v7.pdf')

# Register fonts
pdfmetrics.registerFont(TTFont('Mont', os.path.join(FONTS, 'Montserrat-Regular.ttf')))
pdfmetrics.registerFont(TTFont('MontBold', os.path.join(FONTS, 'Montserrat-Bold.ttf')))
pdfmetrics.registerFont(TTFont('MontSemi', os.path.join(FONTS, 'Montserrat-SemiBold.ttf')))
pdfmetrics.registerFont(TTFont('MontLight', os.path.join(FONTS, 'Montserrat-Light.ttf')))

# Colors
NAVY = HexColor('#003049')
CREAM = HexColor('#FDF0D5')
CRIMSON = HexColor('#C1121F')
STEEL = HexColor('#669BBC')
WHITE = HexColor('#FFFFFF')
LIGHT_CREAM = HexColor('#FAF3E6')

W, H = A4  # 595.28 x 841.89 points

def make_qr(url, size=80):
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=1)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color='#003049', back_color='#FDF0D5')
    buf = BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return ImageReader(buf), size

def draw_image_fit(c, path, x, y, max_w, max_h):
    """Draw image fitting within max_w x max_h, centered at (x, y) being bottom-left."""
    img = Image.open(path)
    iw, ih = img.size
    ratio = min(max_w / iw, max_h / ih)
    dw, dh = iw * ratio, ih * ratio
    # Center horizontally
    cx = x + (max_w - dw) / 2
    cy = y + (max_h - dh) / 2
    c.drawImage(ImageReader(img), cx, cy, dw, dh, preserveAspectRatio=True, mask='auto')

def draw_image_cover(c, path, x, y, box_w, box_h):
    """Draw image covering box completely (crop overflow), centered."""
    img = Image.open(path)
    iw, ih = img.size
    # Scale to cover (larger ratio)
    ratio = max(box_w / iw, box_h / ih)
    new_w, new_h = int(iw * ratio), int(ih * ratio)
    img = img.resize((new_w, new_h), Image.LANCZOS)
    # Crop center
    left = (new_w - int(box_w)) // 2
    top = (new_h - int(box_h)) // 2
    img = img.crop((left, top, left + int(box_w), top + int(box_h)))
    c.drawImage(ImageReader(img), x, y, box_w, box_h, mask='auto')

def page1(c):
    # Background
    c.setFillColor(CREAM)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Navy header bar
    header_h = 70
    c.setFillColor(NAVY)
    c.rect(0, H - header_h, W, header_h, fill=1, stroke=0)

    # Title
    c.setFillColor(WHITE)
    c.setFont('MontBold', 28)
    c.drawString(25, H - 42, 'PoliticDash')
    c.setFillColor(CREAM)
    c.setFont('MontLight', 11)
    c.drawString(25, H - 60, 'Argentina Political-Economic Intelligence Dashboard')

    # QR in header
    qr_img, qr_size = make_qr('https://auparrino.github.io/pol-econ/')
    c.drawImage(qr_img, W - qr_size - 15, H - header_h + 5, qr_size - 10, qr_size - 10)

    # Main screenshot
    y_shot = H - header_h - 310
    shot_path = os.path.join(SHOTS, '01_overview_gov_party.png')
    # Subtle border
    c.setStrokeColor(HexColor('#003049'))
    c.setLineWidth(0.5)
    margin = 25
    c.rect(margin - 2, y_shot - 2, W - 2 * margin + 4, 304, fill=0, stroke=1)
    draw_image_fit(c, shot_path, margin, y_shot, W - 2 * margin, 300)

    # Description
    y_desc = y_shot - 50
    c.setFillColor(NAVY)
    c.setFont('Mont', 10)
    desc = (
        "An interactive map-driven dashboard covering Argentina's political and economic landscape "
        "across 24 provinces. Explore governor alignments, congressional blocs, live macro indicators, "
        "328 mining projects, 78 power plants, provincial cabinets, and 52-sector economic breakdowns "
        "-- updated March 2026 with official sources."
    )
    # Simple text wrapping
    from reportlab.lib.utils import simpleSplit
    lines = simpleSplit(desc, 'Mont', 10, W - 2 * margin)
    for i, line in enumerate(lines):
        c.drawString(margin, y_desc - i * 14, line)

    # Stats grid 3x2
    y_stats = y_desc - len(lines) * 14 - 25
    stats = [
        ('24', 'Provinces Mapped'),
        ('329', 'Legislators Tracked'),
        ('328', 'Mining Projects'),
        ('78', 'Power Plants'),
        ('5', 'Live Market Indicators'),
        ('52', 'Economic Sectors'),
    ]

    col_w = (W - 2 * margin) / 3
    row_h = 55
    for idx, (num, label) in enumerate(stats):
        col = idx % 3
        row = idx // 3
        cx = margin + col * col_w + col_w / 2
        cy = y_stats - row * row_h

        # Number
        c.setFillColor(CRIMSON)
        c.setFont('MontBold', 30)
        c.drawCentredString(cx, cy, num)

        # Label
        c.setFillColor(NAVY)
        c.setFont('Mont', 8.5)
        c.drawCentredString(cx, cy - 16, label)

    # Divider
    y_div = y_stats - 2 * row_h - 10
    c.setStrokeColor(HexColor('#003049'))
    c.setLineWidth(0.3)
    c.line(margin, y_div, W - margin, y_div)

    # Sources footer
    c.setFillColor(HexColor('#003049'))
    c.setFont('MontLight', 7.5)
    c.drawCentredString(W / 2, y_div - 15, 'Sources: INDEC  ·  BCRA  ·  SIACAM  ·  CAMMESA  ·  comovoto.dev.ar  ·  datos.energia.gob.ar')

    # Bottom accent bar
    c.setFillColor(CRIMSON)
    c.rect(0, 0, W, 4, fill=1, stroke=0)


def page2(c):
    # Background
    c.setFillColor(CREAM)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Navy header bar (thin)
    header_h = 45
    c.setFillColor(NAVY)
    c.rect(0, H - header_h, W, header_h, fill=1, stroke=0)

    c.setFillColor(WHITE)
    c.setFont('MontBold', 20)
    c.drawString(25, H - 32, 'Key Features')

    margin = 25
    y_grid = H - header_h - 15

    # 3x2 grid of screenshots
    screenshots = [
        ('02_choropleth_alignment.png', 'Governor alignment choropleth'),
        ('03_choropleth_poverty.png', 'Poverty choropleth by province'),
        ('09_overlay_mining.png', 'Mining projects overlay (328 SIACAM)'),
        ('15_province_neuquen.png', 'Provincial detail panel'),
        ('14_national_cabinet.png', 'National cabinet composition'),
        ('Imagen2.png', 'Provincial congress & vote analysis'),
    ]

    cols, rows = 2, 3
    gap = 10
    img_w = (W - 2 * margin - (cols - 1) * gap) / cols
    img_h = 145
    caption_h = 14

    for idx, (fname, caption) in enumerate(screenshots):
        col = idx % cols
        row = idx // cols
        x = margin + col * (img_w + gap)
        y = y_grid - row * (img_h + caption_h + gap) - img_h

        # Image border
        c.setStrokeColor(HexColor('#003049'))
        c.setLineWidth(0.4)
        c.rect(x - 1, y - 1, img_w + 2, img_h + 2, fill=0, stroke=1)

        path = os.path.join(SHOTS, fname)
        if os.path.exists(path):
            draw_image_fit(c, path, x, y, img_w, img_h)

        # Caption
        c.setFillColor(NAVY)
        c.setFont('Mont', 7.5)
        c.drawCentredString(x + img_w / 2, y - 11, caption)

    # Bullet points — after all 3 rows
    y_bullets = y_grid - rows * (img_h + caption_h + gap) - 10
    bullets = [
        ('Interactive choropleth:', 'party, alignment, poverty, PBG, population, fiscal dependency'),
        ('Real-time macro:', 'USD official/blue/MEP, country risk, deposit rates, gold, copper, lithium'),
        ('Provincial drill-down:', 'governor, cabinet, socioeconomic profile, economic structure'),
        ('Energy overlays:', 'HC fields, gas pipelines, refineries, power plants with production data'),
        ('Legislative tracking:', '329 senators & deputies with government alignment scores'),
        ('Mining intelligence:', '328 projects by mineral, stage, operator country of origin'),
    ]

    c.setFont('MontSemi', 8)
    for i, (bold_part, rest) in enumerate(bullets):
        y = y_bullets - i * 14
        # Bullet dot
        c.setFillColor(CRIMSON)
        c.circle(margin + 4, y + 2.5, 1.5, fill=1, stroke=0)
        # Bold part
        c.setFillColor(NAVY)
        c.setFont('MontSemi', 8)
        c.drawString(margin + 12, y, bold_part)
        bw = pdfmetrics.stringWidth(bold_part, 'MontSemi', 8)
        # Rest
        c.setFont('Mont', 8)
        c.drawString(margin + 12 + bw + 3, y, rest)

    # QR bottom center
    qr_img, qr_size = make_qr('https://auparrino.github.io/pol-econ/')
    qr_draw_size = 55
    c.drawImage(qr_img, W / 2 - qr_draw_size / 2, 30, qr_draw_size, qr_draw_size)
    c.setFillColor(NAVY)
    c.setFont('MontSemi', 7.5)
    c.drawCentredString(W / 2, 20, 'Scan to open live demo')

    # Footer
    c.setFillColor(HexColor('#003049'))
    c.setFont('MontLight', 6.5)
    c.drawCentredString(W / 2, 8, 'Augusto Parrino  ·  github.com/auparrino  ·  March 2026')

    # Bottom accent bar
    c.setFillColor(CRIMSON)
    c.rect(0, 0, W, 4, fill=1, stroke=0)


# Generate
c = canvas.Canvas(OUT, pagesize=A4)
page1(c)
c.showPage()
page2(c)
c.showPage()
c.save()
print(f'PDF generated: {OUT}')
