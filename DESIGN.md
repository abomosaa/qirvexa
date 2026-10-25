---
name: Qirvexa
description: An orderly bilingual operations desk with forest navigation and cool working surfaces.
colors:
  brand: "#1b725c"
  accent: "#a9dfc8"
  bg: "#f3f5f8"
  surface: "#fff"
  ink: "#283b43"
  muted: "#596b77"
  line: "#e2e8ed"
  sidebar: "#173b36"
  nav-selected: "#2d594b"
  nav-selected-ink: "#ddf7eb"
  chart-value: "#a9c2dc"
  chart-paid: "#1d8065"
  danger: "#a33131"
typography:
  headline:
    fontFamily: "IBM Plex Sans Arabic, IBM Plex Sans, sans-serif"
    fontSize: "23px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-.02em"
  title:
    fontFamily: "IBM Plex Sans Arabic, IBM Plex Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.6
  metric:
    fontFamily: "IBM Plex Sans, IBM Plex Sans Arabic, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-.02em"
  data:
    fontFamily: "IBM Plex Sans Arabic, IBM Plex Sans, sans-serif"
    fontSize: "12px"
  label:
    fontFamily: "IBM Plex Sans Arabic, IBM Plex Sans, sans-serif"
    fontSize: "12px"
rounded:
  panel: "12px"
  control: "8px"
  compact-control: "6px"
  nav: "7px"
  badge: "4px"
  dialog: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  panel: "20px"
  xl: "24px"
  xxl: "32px"
  empty: "48px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "9px 16px"
    height: "42px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
  nav-active:
    backgroundColor: "{colors.nav-selected}"
    textColor: "{colors.nav-selected-ink}"
    rounded: "{rounded.nav}"
    padding: "10px 13px"
  metric-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "17px 18px 10px"
---

# Design System: Qirvexa

## Overview

**Creative North Star: "The Quiet Operations Desk"**

Deep forest navigation frames a cool, lightly tinted workspace. White working panels, clear borders, compact type and restrained status color make project records easy to scan. The dashboard adopts the user's chosen reference hierarchy through original implementation; no template assets or code are part of this system.

The current system is extracted from the final workspace redesign block in the stylesheet and its implemented components. Source code is the visual authority; there is no approved image composition. Bilingual behavior, explicit data provenance and visible feedback belong to the working interface.

<div dir="rtl" align="right">مساحة عمل منظمة بهوية خضراء عميقة وخلفية هادئة، مع لوحات بيضاء وحدود واضحة وخطوط مقروءة، وبحد أدنى 12 بكسل للتسميات الثانوية في لوحة التحكم. تدعم العربية من اليمين إلى اليسار والإنجليزية بالكامل. تخدم الحركة فهم التغيير وفتح النوافذ، وتحترم تفضيل تقليل الحركة. القيم المالية من السجلات المحفوظة، مع توضيح أن علامة التحصيل ليست تاريخ دفعة أو كشفًا بنكيًا.</div>

**Key Characteristics:**

- Orderly forest navigation and cool working surfaces.
- Compact bilingual typography with readable data and tabular figures.
- Border-led panels, written states and record-derived charts.
- Local, purposeful motion with reduced-motion feedback.

## Colors

### Primary

Forest brand marks primary actions. Mint provides a narrow selected-navigation marker and supporting emphasis. Navigation selection uses a lighter forest fill and pale text, rather than a solid mint tile.

### Secondary

Muted blue bars encode project contract value; green lines and circular points encode values marked paid. Amber, blue and violet tints distinguish supporting metric symbols and saved project states without taking over the canvas.

### Neutral

The cool canvas separates white working surfaces. Blue-gray ink carries content, muted text carries supporting labels, and pale borders divide groups. Deep forest remains the fixed navigation field. Danger red identifies destructive actions. Exact reusable colors are normative in frontmatter.

**The State Color Rule.** Pair status color with a written label; preserve explicit selected navigation contrast.

**The Record Meaning Rule.** Chart color identifies recorded project value and manually marked paid value by project creation month; it never implies payment receipt dates or bank activity.

## Typography

IBM Plex Sans Arabic leads Arabic; IBM Plex Sans leads English. Both are self-hosted. The family pairing stays consistent across navigation, forms and working panels. Headline, panel title, metric, data and secondary-label roles are recorded in frontmatter; there is no marketing display role.

Page headings step to 22px on phones. Overview metrics step to 25px at the compact desktop breakpoint, 24px on phones and 22px at the narrowest breakpoint. Panel titles step to 14px on phones. Financial summary and workflow totals use context-specific 24px and 33px numerals. Keep dashboard secondary labels at least 12px; ordinary desktop table data and primary client/agenda labels use 12px. Do not reduce type to hide overflow.

**The Numeric Alignment Rule.** Use tabular numerals for amounts, totals, and metrics, retaining readable currency labels in both directions.

## Layout

The desktop sidebar is 238px wide, stepping to 210px at 1250px and 195px at 1050px. Main content is bounded at 1800px with 26px desktop side padding; the sticky white top bar is 66px high. At 1250px content uses 20px side padding. At 760px the rail becomes a 250px explicit drawer, the main area fills the viewport, side padding becomes 14px, and the top bar is 60px high.

The chosen overview has four independent metric panels. The first analysis row pairs a flexible chart with a 280px status panel; the next row pairs the agenda with client value, followed by the project table. Standard row gaps are 20px, with 18px between desktop metrics. At 1250px the status panel narrows to 250px. At 1050px summary metrics use two columns and the analysis/secondary rows stack; the status panel uses its own compact two-column content. Phone gaps are 16px and metric gaps are 10px. Keep these four metric cards: they are an explicit chosen composition, not a rule to impose on every future page.

Linkable project pages retain a client/value/due summary and task/scope tabs. Hidden tab panels retain their fields; keyboard arrows and Home/End follow tab semantics. Navigation guards unsaved work. Client profiles retain a directory/detail composition. Tables scroll inside their container; phone project tables become readable action cards with visible detail and edit controls.

**The Direction Rule.** Use logical spacing and alignment so Arabic RTL and English LTR preserve the same hierarchy.

## Elevation & Depth

Ordinary panels are flat and border-led. Muted fills distinguish search, selected periods, notices and the assistant strip. Dialogs alone carry the broad overlay shadow recorded in the sidecar, over a dark translucent backdrop. Focus uses the existing visible green outline with a 3px width and 3px offset. Do not spread the modal shadow onto dashboard panels.

## Shapes

Working panels and metric cards share gently rounded panel corners. Form controls use tighter control corners, heading/filter controls are more compact, and navigation has its own intermediate radius. Status badges are compact rounded rectangles. The dialog remains softer than the working surface. Account and client monograms use compact rounded squares in the redesigned workspace. Exact reused radii are in frontmatter.

## Components

### Buttons and inputs

Primary buttons use forest fill and white text; secondary buttons use a white surface and pale border. Standard form actions retain a 42px minimum height; compact heading actions use 37px, and phone heading actions use 36px. Inputs retain visible labels, surface fill and a pale border. Search/filter controls use denser 36px sizing. Dashboard icon buttons, row actions and chart-period buttons retain at least 32px control dimensions. Control color/border feedback lasts 140ms; active buttons move down 1px. Focus remains visible rather than relying on hover alone.

### Navigation and states

The rail uses stacked labels with line icons, compact count badges, a light forest selected fill and a mint marker at the logical start edge. Drawer controls stay explicit. Status badges combine words with green, amber or blue tint; saved status drives the distribution track, counts and percentages. Icons support labels or accessible names and are not decorative text glyphs.

### Working panels and tables

Panel headers have a bottom rule and 17px by 20px inset. Secondary content aligns to the same 20px inner edge; phone headers use 15px by 16px. Project rows pair a small project mark with the title, written status, amount, due date and task progress. Hover changes the row background over 140ms. Empty or loading states preserve a readable explanation and a relevant action.

### Charts and client value

The value chart uses blue bars and a green line with visible circular points, a written legend, exact-value tooltips and a projects-table alternative. It explicitly groups values by project creation month. The chart period and summary scope must remain legible: the current All control draws the last six months while summary values cover all filtered records. Client value ranks up to four clients from filtered project records and pairs every proportion track with the amount and project count.

Chart entrance lasts 420ms; client proportion bars reveal over 420ms using the recorded ease-out curve. The client-bar origin follows text direction. Saved state distribution changes use a 300ms flex transition. Do not animate numbers independently of their record values.

### Dialogs, notices and workspace truth

Native dialogs scroll within the viewport, expose visible form labels, close through explicit controls or Escape, and restore focus to the previous control. Opening uses a 240ms local fade/translation/scale with a 180ms backdrop change. Notices retain status semantics and use a 200ms color confirmation. Reduced motion removes chart, client-bar, dialog, backdrop, drawer and spatial button motion; a short 120ms notice color confirmation remains.

Guest storage remains visibly local to the device; signed-in data is user-specific. The interface does not imply that signing in uploads guest records. Preserve unsaved forms during tabs and guarded navigation. AI briefs remain editable drafts for review. These interface cues support the product constraints; they are not new authentication, collaboration or payment capabilities.

## Do's and Don'ts

### Do:

- **Do** preserve Arabic-first RTL and complete English layouts.
- **Do** use borders, alignment, and spacing to group operational information.
- **Do** keep written status labels beside color cues.
- **Do** retain local-storage, sample-data and draft cues where their state applies.
- **Do** make motion explain a local state change and honor reduced-motion preferences.

### Don't:

- **Don't** introduce ornamental dashboard shadows or marketing hero treatments.
- **Don't** replace labeled sample data with implied real customer or revenue claims.
- **Don't** imply receipt dates, bank activity or payment collection from a manually marked paid field.
- **Don't** shrink dashboard secondary labels below 12px to fit content.
