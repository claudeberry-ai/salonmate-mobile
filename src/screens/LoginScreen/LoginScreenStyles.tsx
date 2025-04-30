import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  textInput: {
    height: 50,
  },
  loginButtonHolder: {
    backgroundColor: '#E16A54',
    width: 100,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  inputContainer:{
    height:80,
  },
  errorBorder: {
    borderWidth: 2,
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    // marginBottom: 10,
  },
  loadingScreen:{
    flex:1,
    justifyContent:'center',
    alignItems:'center'
  }
});
