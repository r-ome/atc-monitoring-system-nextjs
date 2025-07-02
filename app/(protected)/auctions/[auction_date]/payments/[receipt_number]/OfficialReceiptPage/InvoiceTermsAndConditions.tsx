import { Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderBottom: 1,
    // borderRight: 1,
    // borderLeft: 1,
    height: 20,
    textAlign: "center",
    paddingTop: 5,
    paddingLeft: 2,
    width: "100%",
    fontSize: 9,
  },
});

const InvoiceTermsAndConditions = () => (
  <View
    wrap={false}
    style={{ marginRight: 6, borderRight: 1, borderLeft: 1, width: 585 }}
  >
    <View style={styles.container}>
      <Text>
        * We are an Auction house for JAPAN SURPLUS items. Items bid will not be
        in perfect condition unless stated.
      </Text>
    </View>

    <View style={styles.container}>
      <Text>
        *Bid at your own risk. Everything will be sold at an AS IS, WHERE IS
        basis.
      </Text>
    </View>

    <View style={styles.container}>
      <Text>
        You will be given VIEWING time to carefully examine each item before
        bidding starts.
      </Text>
    </View>

    <View style={styles.container}>
      <Text>
        We will not be held liable for expectations of an item thus we will not
        accept REFUNDS/ CANCELLING for items that
      </Text>
    </View>

    <View style={styles.container}>
      <Text>
        has been sold. (Unless mixed/wrong items are given to you by mistake)
      </Text>
    </View>

    <View style={styles.container}>
      <Text>
        * Claims about items will be checked using the COUNTER CHECK and
        MANIFEST. If both checks out, It means that the item is yours.
      </Text>
    </View>

    <View style={styles.container}>
      <Text>
        * Further claims will be checked via the LIVE video. False claims that
        have been proven wrong via video might result in BANNING.
      </Text>
    </View>

    <View style={styles.container}>
      <Text>
        * In case the product /goods purchased on auction is not taken or picked
        up within three (3)days,the bid-winner
        <br /> shall be charge of storage fee
      </Text>
    </View>

    <View style={styles.container}>
      <Text>at the rate of P200.00per day.</Text>
    </View>

    <View style={styles.container}>
      <Text>
        *Unpaid items will have be automatically CANCELLED and REBID after a
        total of 7 working days.
      </Text>
    </View>

    <View style={styles.container}>
      <Text>
        *in case the bid items are not taken or picked up within seven (7) days
        from auction day,the goods/products are forfeited in favor of{" "}
      </Text>
    </View>

    <View style={styles.container}>
      <Text>ATC Japan Product Trading.</Text>
    </View>

    <View style={styles.container}>
      <Text>
        * Claims about items will be checked using the COUNTER CHECK and
        MANIFEST. If both checks out, It means that the item is yours.
      </Text>
    </View>

    <View style={styles.container}>
      <Text>
        * Further claims will be checked via the LIVE video. False claims that
        have been proven wrong via video might result in BANNING.
      </Text>
    </View>
  </View>
);

export default InvoiceTermsAndConditions;
