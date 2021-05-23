import React, { Component } from "react";
import { Text, View, TextInput, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons'
import ContactPeek from './../../components/ContactPeek';
import userData from './../../store/userData';

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        width: "100%",
        height: "100%",
    }, searchContainer: {
        alignItems: 'center'
    }, input: {
        textAlign: 'center',
        width: '70%',
        margin: 10,
        height: 40,
        borderRadius: 5,
        fontSize: 17,
    }, errorMsg: {
        color: 'red',
        textAlign: 'center',
        fontSize: 20
    }, newContactBtn: {
        alignSelf: 'flex-end',
        padding: 20,
        margin: 20,
        borderRadius: 100,
        backgroundColor: '#00a000',//'#627894',
        shadowColor: "#000",
        elevation: 12,
    }

});

class AddContact extends Component {
    constructor(props) {
        super(props);

        this.state = {
            prefix: '',
            loading: true,
            results: [],
        }
    }

    componentDidMount() {
        // Should load all contacts from storage
        this.setState({ loading: false })
    }

    searchUsers = async (newPrefix) => {
        // UX
        this.setState({ loading: true, prefix: newPrefix });
        if (newPrefix.length <= 2) return

        // Load data
        const newResults = await userData.searchUsers(newPrefix);
        console.log("RESULTS:")
        console.log(newResults)

        // Sort results
        this.setState({ results: newResults.sort((r1, r2) => (r1.identifier > r2.identifier) ? 1 : -1), loading: false });
    }

    render() {
        const { navigation } = this.props;
        return (
            <View style={styles.wrapper}>
                {/* Search */}
                <View style={styles.searchContainer}>
                    <TextInput placeholder="Search contacts"
                        value={this.state.prefix}
                        onChangeText={TextInputValue => this.searchUsers(TextInputValue)}
                        underlineColorAndroid='transparent'
                        style={styles.input}
                    />
                </View>

                {/* Contact List */}
                <ScrollView>
                    { /* Contacts */
                        this.state.loading
                            ? <ActivityIndicator size="large" color='#fc501c' />
                            : this.state.results && this.state.results.length > 0
                                ? this.state.results.map((res, index) => {
                                    return <ContactPeek data={res} key={index} navigation={navigation} />
                                })
                                : <Text style={styles.errorMsg}>No results</Text>
                    }

                </ScrollView>
            </View>
        );
    }

}

export default AddContact;