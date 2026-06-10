/** Returns sx-compatible style objects for use with MUI Box/sx prop. Pass theme from useTheme(). */
export default function getStyle(theme) {
  return {
    title: {
      paddingBottom: "15px",
      paddingTop: "15px",
      position: "sticky",
      fontSize: "17px",
      fontWeight: "700",
      top: 0,
      backgroundColor: "white",
      zIndex: 2,
      textTransform: "uppercase",
      display: "flex",
      justifyContent: "space-between",
      height: "54px",
      color: theme.colors.neutral,
      alignItems: "center",
    },
    multiSections: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "stretch",
      flexDirection: "column",
      "@media screen and (min-width: 768px)": {
        flexDirection: "row",
      },
    },
    section: {
      flex: "1 1 0px",
      color: theme.colors.neutral,
      display: "flex",
      flexDirection: "column",
      paddingLeft: "15px",
      paddingRight: "15px",
      // paddingBottom: '15px',
      height: "100%",
      "@media screen and (min-width: 768px)": {
        paddingRight: 0,
      },
    },
    sectionDivider: {
      width: "100%",
      height: "1px",
      backgroundColor: theme.colors.neutral_2,
      "@media screen and (min-width: 768px)": {
        width: "1px",
        height: "unset",
      },
    },
    subTitle: {
      fontSize: "15px",
      fontWeight: "700",
      color: theme.colors.neutral,
      textTransform: "uppercase",
    },
    subSection: {
      display: "flex",
      flexDirection: "column",
      paddingBottom: "15px",
    },
    text: {
      fontSize: "15px",
      fontWeight: "normal",
      color: theme.colors.neutral,
      whiteSpace: "pre-line",
    },
    tableTitle: {
      textTransform: "uppercase",
      color: theme.colors.neutral,
    },
    actions: {
      display: "flex",
      justifyContent: "space-between",
      minWidth: "150px",
      direction: "rtl",
      color: theme.colors.neutral_2,
      "& [data-lucide], & .MuiSvgIcon-root:hover": {
        color: theme.colors.neutral,
      },
    },
    action: {
      cursor: "pointer",
      "&:hover": {
        textDecoration: "underline",
      },
    },
    disabledAction: {
      opacity: 0.4,
    },
    link: {
      color: theme.colors.neutral,
      cursor: "pointer",
      "&:hover": {
        textDecoration: "underline",
      },
    },
    stickyHeaderCell: {
      backgroundColor: "white",
      paddingTop: "5px",
      paddingBottom: "5px",
      fontSize: "14px",
      fontWeight: "500",
      color: theme.colors.neutral_3,
      borderTop: `1px solid ${theme.colors.neutral_2}`,
      borderBottom: `1px solid ${theme.colors.neutral_2}`,
      zIndex: 6,
      textTransform: "uppercase",
    },
    tableCell: {
      fontSize: "16px",
      color: theme.colors.datasance_color_0,
    },
    headerCell: {
      fontSize: "14px",
      fontWeight: "500",
      color: theme.colors.neutral_3,
    },
    tableRowHover: {
      "&:hover": {
        backgroundColor: "#f4f5f6!important",
      },
    },
    cardTitle: {
      position: "sticky",
      top: 0,
      backgroundColor: "white",
      zIndex: 6,
    },
    bottomPad: {
      paddingBottom: "15px",
    },
    narrowSearchBar: {
      height: "24px",
      fontSize: "12px",
      "& svg": {
        height: "18px",
        width: "18px",
      },
    },
    stickyLeft: {
      position: "sticky",
      left: "15px",
      maxWidth: "100px",
      "@media screen and (min-width: 576px)": {
        maxWidth: "unset",
      },
    },
    stickyRight: {
      position: "sticky",
      right: "15px",
      maxWidth: "100px",
      "@media screen and (min-width: 576px)": {
        maxWidth: "unset",
      },
    },
    textEllipsis: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
  };
}
