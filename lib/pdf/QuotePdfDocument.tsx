import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// Cores da identidade Facio
const C = {
  text:    "#1A1A2E",
  muted:   "#6B7280",
  border:  "#E5E7EB",
  primary: "#639922",
  surface: "#F4F6F3",
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    color: C.text,
    fontFamily: "Helvetica",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  brand: {
    fontSize: 20,
    fontWeight: 700,
    color: C.text,
  },
  brandAccent: {
    color: C.primary,
  },
  brandSub: {
    fontSize: 9,
    color: C.muted,
    marginTop: 2,
  },
  statusBadge: {
    fontSize: 9,
    color: C.primary,
    backgroundColor: "#EAF3DE",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 9,
    color: C.muted,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  sectionValue: {
    fontSize: 12,
    color: C.text,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginVertical: 16,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableHeaderText: {
    fontSize: 9,
    color: C.muted,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  colDesc:  { flex: 3 },
  colQtd:   { flex: 1, textAlign: "center" },
  colValor: { flex: 1, textAlign: "right" },
  colSub:   { flex: 1, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: C.text,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: 700,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 700,
    color: C.primary,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: C.muted,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 10,
  },
});

const STATUS_LABEL: Record<string, string> = {
  draft:    "Rascunho",
  sent:     "Aguardando aprovação",
  approved: "Aprovado",
  paid:     "Pago",
};

type QuoteItem = { descricao: string; quantidade: number; valor_unit: number; subtotal: number };

export type QuotePdfData = {
  providerName:  string;
  providerWhats: string;
  clientName:    string;
  clientWhats:   string;
  status:        string;
  total:         number;
  notes?:        string | null;
  createdAt:     string;
  items:         QuoteItem[];
  publicUrl:     string;
};

export function QuotePdfDocument({ data }: { data: QuotePdfData }) {
  const dateFormatted = new Date(data.createdAt).toLocaleDateString("pt-BR");

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>
              fa<Text style={styles.brandAccent}>c</Text>io
            </Text>
            <Text style={styles.brandSub}>{data.providerName} · {data.providerWhats}</Text>
          </View>
          <Text style={styles.statusBadge}>{STATUS_LABEL[data.status] ?? data.status}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Orçamento para</Text>
          <Text style={styles.sectionValue}>{data.clientName}</Text>
          <Text style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{data.clientWhats}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Data</Text>
          <Text style={styles.sectionValue}>{dateFormatted}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>Serviço</Text>
          <Text style={[styles.tableHeaderText, styles.colQtd]}>Qtd</Text>
          <Text style={[styles.tableHeaderText, styles.colValor]}>Valor</Text>
          <Text style={[styles.tableHeaderText, styles.colSub]}>Subtotal</Text>
        </View>

        {data.items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colDesc}>{item.descricao}</Text>
            <Text style={styles.colQtd}>{item.quantidade}</Text>
            <Text style={styles.colValor}>R$ {item.valor_unit.toFixed(2)}</Text>
            <Text style={styles.colSub}>R$ {item.subtotal.toFixed(2)}</Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>R$ {data.total.toFixed(2)}</Text>
        </View>

        {data.notes && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionLabel}>Observações</Text>
            <Text style={{ fontSize: 10, color: C.muted }}>{data.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Aprove e pague este orçamento online em {data.publicUrl}{"\n"}
          Gerado via Facio · gestão para autônomos
        </Text>
      </Page>
    </Document>
  );
}
