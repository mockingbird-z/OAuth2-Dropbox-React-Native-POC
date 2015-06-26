/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */
'use strict';

var React = require('react-native');
var config = require('./config.js');
var shittyQs = require('shitty-qs');

var {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  LinkingIOS,
  ListView,
  NavigatorIOS,
  Image
} = React;

function dropboxOAuth2 (appKey, callback) {

  LinkingIOS.addEventListener('url', handleUrl);

  function handleUrl (event) {
    console.log(event.url);
    var [, query_string] = event.url.match(/\#(.*)/);
    var query = shittyQs(query_string);
    callback(null, query.access_token, query.uid);
    LinkingIOS.removeEventListener('url', handleUrl);
  }

  LinkingIOS.openURL([
    'https://www.dropbox.com/1/oauth2/authorize',
    '?response_type=token',
    '&client_id=',
    appKey,
    '&redirect_uri=rctdropboxpoc://poc'
  ].join(''));
}

var folderList = React.createClass({
  getInitialState: function () {
    if (this.props && this.props.access_token) {
      return {
        dataSource: this.props.dataSource,
        access_token: this.props.accessToken
      };
    }
  },
  renderContent: function(item) {
    var url = (item.icon && item.icon === 'folder') ? 'http://icons.iconarchive.com/icons/hopstarter/mac-folders/24/Dropbox-icon.png' : 'http://icons.iconarchive.com/icons/hopstarter/sleek-xp-basic/24/Document-icon.png';
    return (
      <View style={styles.innerContainer}>
        <Image
          source={{uri: url}}
          style={styles.thumbnail}
        />        
        <View style={styles.rightContainer}>
          <Text style={styles.title}>{item.path && item.path.substring(1)}</Text>
        </View>
      </View>   
      ); 
  },  
  renderLoadingView: function() {
    return (
      <View style={styles.outerContainer}>
        <Text>
          Loading contents...
        </Text>
      </View>
    );
  },
  render: function() {
    if (!this.props || !this.props.access_token) {
      return this.renderLoadingView();
    }    
    return (
      <View style={styles.outerContainer}>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this.renderContent}
          style={styles.listView}
        />
      </View>
    );
  } 
});

var DropboxRctApp = React.createClass({
  fetchContents: function(accessToken) {
    var authorizationString = 'Bearer ' + accessToken;
    fetch(
      'https://api.dropbox.com/1/metadata/auto/', {
        method: 'GET',
        headers: {
          'Authorization': authorizationString
        }
      })
      .then((response) => response.json())
      .then((responseData) => {
        this.setState({
          dataSource: this.state.dataSource.cloneWithRows(responseData.contents),
          access_token: accessToken
        });
      })
      .done();    
  },
  getInitialState: function() {
    var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    return {
      dataSource: ds.cloneWithRows(['row 1', 'row 2']),
      access_token: ''
    };
  },
  componentDidMount: function () {
    dropboxOAuth2(config.app_key, (err, accessToken) => {
      if (err) { 
        console.log(err);
      }
      this.fetchContents(accessToken);     
    });
  },
  renderEmptyView: function() {
    return (
      <View style={styles.outerContainer}>
        <Text>
          Loading...
        </Text>
      </View>
    );
  },
  render: function() {
    if (!this.state || !this.state.access_token) {
      return this.renderEmptyView();
    }  
    return (
      <NavigatorIOS
        style={styles.topContainer}
        initialRoute={{
          component: folderList,
          title: 'Dropbox Folder',
          rightButtonTitle: '+',
          onRightButtonPress: function() {
            var authorizeString = 'Bearer ' + (this.state && this.state.access_token);
            var path = 'Folder_' + Math.random().toString().substring(12);
            fetch(
              'https://api.dropbox.com/1/fileops/create_folder', {
                method: 'POST',
                headers: {
                  'Authorization': authorizeString
                },
                body: 'root=auto&path=' + path
              }
            ).then(function() {
              this.fetchContents(this.state.access_token);
            }.bind(this));
          }.bind(this),
          passProps: {
            dataSource: this.state.dataSource,
            access_token: this.state.access_token,
            dataSourceHandler: this.fetchContents
          }
        }}
        tintColor="#FFFFFF"
        barTintColor="#183E63"
        titleTextColor="#FFFFFF"
      />
    );
  }
});

var styles = StyleSheet.create({
  topContainer: {
    flex: 1 
  },
  innerContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F5FCFF'
  },
  outerContainer: {
    flex: 1,
    backgroundColor: '#F5FCFF'
  },  
  listView: {
    paddingTop: 20,
    paddingLeft: 10,
    backgroundColor: '#F5FCFF'
  },
  rightContainer: {
    flex: 1
  },
  title: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'left',
    paddingLeft: 5
  },
  thumbnail: {
    width: 24,
    height: 24
  }
});

AppRegistry.registerComponent('DropboxRctApp', () => DropboxRctApp);
