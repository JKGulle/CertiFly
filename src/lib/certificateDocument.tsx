import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { Signatory } from "./template";

export interface CertificateDocumentProps {
  title: string;
  orgName: string;
  recipientName: string;
  bodyText: string; // already merged, plain text
  issuedDateLabel: string;
  signatories: Signatory[];
  accentColor: string;
  verificationCode: string;
  qrDataUrl: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
  },
  border: {
    margin: 24,
    borderWidth: 2,
    borderStyle: "solid",
    flex: 1,
    padding: 48,
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  // Sits between the background image and the content so arbitrary
  // admin-supplied images don't wreck text legibility.
  backgroundOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#FFFFFF",
    opacity: 0.82,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "#655F4E",
    marginBottom: 14,
  },
  title: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    marginBottom: 18,
    textAlign: "center",
  },
  lede: {
    fontSize: 12,
    color: "#4A4636",
    marginBottom: 6,
  },
  recipientName: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    marginVertical: 16,
    textAlign: "center",
  },
  body: {
    fontSize: 12,
    color: "#3A362A",
    textAlign: "center",
    maxWidth: 420,
    lineHeight: 1.5,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    width: "100%",
    marginTop: 36,
  },
  signaturesGroup: {
    flexDirection: "row",
    gap: 20,
  },
  signatureBlock: {
    alignItems: "flex-start",
    minWidth: 130,
  },
  signatureImage: {
    height: 28,
    marginBottom: 2,
    objectFit: "contain",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#221D14",
    paddingTop: 4,
  },
  // Blank space standing in for a handwritten signature when no image was
  // uploaded — skipped when an image already fills that role.
  signatureLineBlankSpace: {
    marginTop: 28,
  },
  signatureName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  signatureTitle: {
    fontSize: 9,
    color: "#655F4E",
  },
  qrBlock: {
    alignItems: "center",
  },
  qrImage: {
    width: 70,
    height: 70,
  },
  code: {
    fontSize: 8,
    color: "#655F4E",
    marginTop: 4,
  },
  dateBlock: {
    alignItems: "flex-end",
    minWidth: 160,
  },
  logo: {
    width: 48,
    height: 48,
    marginBottom: 12,
  },
});

export function CertificateDocument(props: CertificateDocumentProps) {
  const {
    title,
    orgName,
    recipientName,
    bodyText,
    issuedDateLabel,
    signatories,
    accentColor,
    verificationCode,
    qrDataUrl,
    logoUrl,
    backgroundImageUrl,
  } = props;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={[styles.border, { borderColor: accentColor }]}>
          {backgroundImageUrl ? (
            <>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image draws into a PDF, not the DOM; it has no alt prop */}
              <Image src={backgroundImageUrl} style={styles.backgroundImage} />
              <View style={styles.backgroundOverlay} />
            </>
          ) : null}
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image draws into a PDF, not the DOM; it has no alt prop */}
          {logoUrl ? <Image src={logoUrl} style={styles.logo} /> : null}
          <Text style={[styles.eyebrow, { color: accentColor }]}>{orgName}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.lede}>This certifies that</Text>
          <Text style={styles.recipientName}>{recipientName}</Text>
          <Text style={styles.body}>{bodyText}</Text>

          <View style={styles.footerRow}>
            <View style={styles.signaturesGroup}>
              {signatories.map((sig, i) => (
                <View key={i} style={styles.signatureBlock}>
                  {sig.imageUrl ? (
                    // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image draws into a PDF, not the DOM; it has no alt prop
                    <Image src={sig.imageUrl} style={styles.signatureImage} />
                  ) : null}
                  <View style={[styles.signatureLine, sig.imageUrl ? undefined : styles.signatureLineBlankSpace]}>
                    <Text style={styles.signatureName}>{sig.name}</Text>
                    <Text style={styles.signatureTitle}>{sig.title}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.qrBlock}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image draws into a PDF, not the DOM; it has no alt prop */}
              <Image src={qrDataUrl} style={styles.qrImage} />
              <Text style={styles.code}>{verificationCode}</Text>
            </View>

            <View style={styles.dateBlock}>
              <Text style={styles.signatureTitle}>Issued</Text>
              <Text style={styles.signatureName}>{issuedDateLabel}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
