---
name: Qirvexa
description: A quiet bilingual operations desk with forest navigation and limestone surfaces.
colors:
  brand: "#176748"
  accent: "#a9d8b3"
  bg: "#f4f6f3"
  surface: "#fff"
  ink: "#172a25"
  muted: "#52655d"
  line: "#dce5dd"
  sidebar: "#102c22"
  danger: "#a33131"
typography:
  headline:
    fontFamily: "IBM Plex Sans Arabic, IBM Plex Sans, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "-.025em"
  title:
    fontFamily: "IBM Plex Sans Arabic, IBM Plex Sans, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.6
  metric:
    fontFamily: "IBM Plex Sans, IBM Plex Sans Arabic, sans-serif"
    fontSize: "32px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "-.025em"
  label:
    fontFamily: "IBM Plex Sans Arabic, IBM Plex Sans, sans-serif"
    fontSize: "12px"
rounded:
  panel: "14px"
  control: "8px"
  badge: "5px"
  dialog: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  empty: "48px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "9px 16px"
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
    backgroundColor: "{colors.accent}"
    textColor: "{colors.sidebar}"
    rounded: "{rounded.control}"
    padding: "12px 15px"
---

# Design System: Qirvexa

## Overview

**Creative North Star: "The Quiet Operations Desk"**

Pale limestone working surfaces sit beside deep forest navigation. Alignment, rules, and restrained mint states organize dense operational information. This is the implemented original identity; shadcn research informed hierarchy only.

**Key Characteristics:**

- Calm forest and limestone contrast.
- Compact bilingual operational typography.
- Border-led surfaces and tabular figures.

## Colors

### Primary

Forest brand marks primary actions; soft mint identifies active navigation and related emphasis.

### Neutral

Limestone is the workspace, white is the working surface, deep ink carries content, muted green carries support text, and pale rules separate groups. The sidebar is a dark forest field. Danger red identifies destructive action. Exact source values are normative in frontmatter.

**The State Color Rule.** Pair status color with a written label; preserve explicit selected navigation contrast.

## Typography

IBM Plex Sans Arabic leads Arabic; IBM Plex Sans leads English. Both are self-hosted. The headline, title, metric, and label roles are recorded above. Main headings reduce to 27px below 1200px; metric values vary between 27px and 32px with viewport density. Body copy varies by context rather than using one global body-size token.

**The Numeric Alignment Rule.** Use tabular numerals for amounts, totals, and metrics, retaining readable currency labels in both directions.

## Layout

The desktop sidebar is 240px wide, stepping down to 215px and 190px. The main region is bounded at 1600px with 36px desktop padding. Metrics use four columns, then two below 1000px. Charts and brief/settings grids stack as space narrows. Below 760px the sidebar becomes an explicit drawer and content uses 16px side padding. Tables scroll within their own container.

**The Direction Rule.** Use logical spacing and alignment so Arabic RTL and English LTR preserve the same hierarchy.

## Elevation & Depth

Panels stay flat with pale borders; tint separates the assistant strip and notices. Dialogs alone use a broad overlay shadow (`0 20px 80px #102c2233`) over a dark translucent backdrop. Do not apply the dialog shadow to ordinary dashboard panels.

## Shapes

Panels have soft corners; controls are tighter; small status badges are compact. Circular account avatars remain distinct from working surfaces. The frontmatter records the reused radii.

## Components

Primary buttons are forest with white text, 42px minimum height, and a darker hover. Secondary buttons are white with a pale rule. Inputs use the same control radius, a surface fill, and a pale border. Interactive elements show a 3px green focus outline with a 3px offset.

Navigation is vertically stacked with mint selection. Status badges combine tinted fills and words. Charts retain labeled legends and tabular summaries. Panels use generous title insets without shadows. Native dialogs scroll within the viewport and preserve visible form labels. Control transitions last 180ms; the mobile drawer uses 200ms. Reduced motion disables transitions and shortens animation duration.

## Workspace expansion — 2026-10-24 / توسعة مساحة العمل

The overview pairs a compact next-action agenda with the creation-period value chart; a date/state row provides useful context. Linkable project pages use one clear title, client/value/due summary, and task/scope tabs. Both tab panels retain their fields while hidden; Home/End and arrows follow tab semantics. Navigation protects unsaved work. Client profiles use a directory/detail composition; finance separates recorded contract, marked paid and outstanding values. Mobile project tables become readable action cards, with visible edit/detail controls. Latin tabular numerals make 5 distinct from 0 in Arabic at compact sizes.

<div dir="rtl" align="right">تجمع النظرة العامة المواعيد القريبة والرسم المالي في ترتيب مدمج. للمشروع صفحة مستقلة بمهام ونطاق وملاحظات، مع حماية المسودات ودعم لوحة المفاتيح. تعرض ملفات العملاء البيانات والمشاريع المرتبطة، وتتحول المشاريع إلى بطاقات عملية على الهاتف. بقيت هوية الألوان والخطوط القائمة.</div>

## Do's and Don'ts

- Do preserve Arabic-first RTL and complete English layouts.
- Do use borders, alignment, and spacing to group operational information.
- Do keep written status labels beside color cues.
- Don't introduce ornamental dashboard shadows or marketing hero treatments.
- Don't replace labeled sample data with implied real customer or revenue claims.
