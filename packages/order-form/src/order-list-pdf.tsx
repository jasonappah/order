import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import type {  OrderLineItem } from './types';
import { formatDate, formatCentsAsDollarString, calculateTotalCents, calculateOrderLineItemTotal } from './utilities';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCol: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableCell: {
    fontSize: 10,
  },
  total: {
    marginTop: 20,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  date: {
    fontSize: 12,
    marginBottom: 20,
  },
  link: {
    fontSize:6
  },
});

type OrderListPDFProps = { 
  projectName: string
  businessJustification: string
  requestDate: Date
  items: OrderLineItem[]
  vendor: string
}



export const OrderListPDF = ({ projectName, businessJustification, requestDate, items, vendor }: OrderListPDFProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Requested Items</Text>
          <Text style={styles.date}>Request Date: {formatDate(requestDate)}</Text>
          <Text style={styles.date}>Vendor: {vendor}</Text>
        </View>

        
        <View style={styles.section}>
          <Text style={styles.subtitle}>Order Items</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCol, styles.tableCell]}>Name</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>URL</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>$/Unit</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>Qty</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>S&H</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>Total</Text>
            </View>
            
            {items.map((item) => (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCol, styles.tableCell]}>{item.name}</Text>
                <Text style={[styles.tableCol, styles.link]}><Link href={item.url}>{item.url}</Link></Text>
                <Text style={[styles.tableCol, styles.tableCell]}>{formatCentsAsDollarString(item.pricePerUnitCents)}</Text>
                <Text style={[styles.tableCol, styles.tableCell]}>{item.quantity}</Text>
                <Text style={[styles.tableCol, styles.tableCell]}>{formatCentsAsDollarString(item.shippingAndHandlingCents)}</Text>
                <Text style={[styles.tableCol, styles.tableCell]}>
                  {formatCentsAsDollarString(calculateOrderLineItemTotal(item))}
                </Text>
              </View>
            ))}
          </View>
          
          <View style={styles.total}>
            <Text>Total: {formatCentsAsDollarString(calculateTotalCents(items))}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};



