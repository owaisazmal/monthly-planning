import { StyleSheet } from 'react-native';
import { FONT, Palette, RADIUS, cardSurface } from '../theme';

/**
 * Every surface on the planner screen. Split from the screen itself because it
 * is a third of the file and changes for entirely different reasons — a colour
 * or spacing tweak has no business sitting in the same file as the data flow.
 */
export const makeStyles = (p: Palette) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    flex: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 48,
      paddingTop: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 18,
      paddingHorizontal: 4,
    },
    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 2,
    },
    headerSub: {
      fontSize: 11,
      fontFamily: FONT.bold,
      letterSpacing: 4,
      color: p.accent,
      // Josefin sits high in its box; nudge the caps onto the mark's centreline
      marginTop: 3,
    },
    headerTitle: {
      fontSize: 30,
      fontFamily: FONT.bold,
      letterSpacing: 1,
      color: p.ink,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    themeBtn: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
      borderColor: p.lineFaint,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: p.card,
    },
    monthNav: {
      ...cardSurface(p),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: RADIUS.card,
      paddingVertical: 8,
      paddingHorizontal: 10,
      marginBottom: 14,
    },
    navBtn: {
      width: 34,
      height: 34,
      borderRadius: RADIUS.pill,
      backgroundColor: p.chip,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navArrow: {
      fontSize: 20,
      fontFamily: FONT.bold,
      color: p.ink,
      lineHeight: 24,
    },
    monthLabelBox: {
      alignItems: 'center',
    },
    monthLabel: {
      fontSize: 16,
      fontFamily: FONT.bold,
      letterSpacing: 2,
      color: p.ink,
    },
    yearLabel: {
      fontSize: 11,
      fontFamily: FONT.semibold,
      letterSpacing: 1,
      color: p.inkSoft,
    },
    chartCard: {
      ...cardSurface(p),
      alignItems: 'center',
      paddingVertical: 18,
      paddingHorizontal: 16,
      marginBottom: 14,
    },
    chartHead: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'stretch',
      marginBottom: 12,
    },
    accent: {
      width: 4,
      height: 15,
      borderRadius: 2,
      backgroundColor: p.accent,
      marginRight: 8,
    },
    chartTitle: {
      flex: 1,
      fontSize: 13,
      fontFamily: FONT.bold,
      letterSpacing: 2,
      color: p.ink,
    },
    // The options share the width evenly so the sliding pill is one size in
    // both positions; that needs a definite width here, since this row sizes
    // itself to its content.
    segment: {
      width: 152,
    },
    chartLoading: {
      height: 140,
    },
    chartHint: {
      marginTop: 10,
      fontSize: 13,
      fontFamily: FONT.regular,
      color: p.inkSoft,
      textAlign: 'center',
      paddingHorizontal: 24,
    },
    statsRow: {
      marginTop: 12,
      alignItems: 'center',
      alignSelf: 'stretch',
      gap: 6,
    },
    progressTrack: {
      alignSelf: 'stretch',
      height: 6,
      borderRadius: 3,
      backgroundColor: p.chip,
      overflow: 'hidden',
    },
    progressFill: {
      height: 6,
      borderRadius: 3,
      backgroundColor: p.done,
    },
    statsLine: {
      fontSize: 12,
      color: p.inkSoft,
    },
    statsDone: {
      color: p.done,
      fontFamily: FONT.bold,
    },
    legend: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
    },
    legendSwatch: {
      width: 12,
      height: 12,
      borderRadius: 3,
    },
    legendEmpty: {
      backgroundColor: p.cellEmpty,
      borderWidth: 1,
      borderColor: p.line,
    },
    legendText: {
      fontSize: 12,
      fontFamily: FONT.regular,
      color: p.inkSoft,
      marginRight: 8,
    },
    section: {
      marginBottom: 14,
    },
    quoteCard: {
      ...cardSurface(p),
      marginTop: 2,
      paddingVertical: 16,
      paddingHorizontal: 18,
    },
    // an inline accent bar, matching every other section — a borderLeft would
    // detach into a floating arc against the card's large corner radius
    quoteHead: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    quoteLabel: {
      fontSize: 12,
      fontFamily: FONT.bold,
      letterSpacing: 2,
      color: p.accent,
    },
    quote: {
      fontSize: 13,
      // the italic family carries the slant; fontStyle would be ignored here
      fontFamily: FONT.italic,
      lineHeight: 19,
      color: p.inkSoft,
    },
  });
