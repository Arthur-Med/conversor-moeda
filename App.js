import 'react-native-url-polyfill/auto';
import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  Modal,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

// minha api
const API_KEY = 'f9ac5639a8fc2797ec6da213';
const URL_API = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`;

function MeuBotao(props) {
  return (
    <TouchableOpacity
      style={[styles.btnPadrao, props.style]}
      onPress={props.clique || props.onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={[styles.btnTexto, props.textStyle]}>{props.titulo}</Text>
    </TouchableOpacity>
  );
}

function CardMoeda({ item, isFavorita, onToggleFavorita }) {
  return (
    <View style={styles.cardMoeda}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardCodigo}>{item.codigo}</Text>
        <Text style={styles.cardTaxa}>1 USD = {item.taxa} {item.codigo}</Text>
      </View>

      <TouchableOpacity
        onPress={() => onToggleFavorita(item.codigo)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialIcons
          name={isFavorita ? 'star' : 'star-border'}
          size={28}
          color={isFavorita ? '#EAB308' : '#94A3B8'}
        />
      </TouchableOpacity>
    </View>
  );
}


// tela inicial
function InicioScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.telaContainer} edges={['bottom', 'left', 'right']}>
      <View style={styles.inicioConteudo}>

        <Text style={styles.tituloPrincipal}>Conversor de Moedas</Text>

        <Text style={styles.descricaoInicio}>
          Aplicativo para consultar e converter os valores das moedas desse mundão. 
          Um grande abraço Vitor. 🫪
        </Text>

        <View style={styles.cardObjetivo}>
          <Text style={styles.cardObjetivoTitulo}>Funcionalidades:</Text>
          <Text style={styles.itemObjetivo}>• Listar todas as moedas da API.</Text>
          <Text style={styles.itemObjetivo}>• Favoritar/desfavoritar as moedas.</Text>
          <Text style={styles.itemObjetivo}>• Conversão dos valores entre moedas.</Text>
        </View>

        <MeuBotao
          titulo="Acessar Moedas"
          clique={() => navigation.navigate('Moedas')}
          style={{ width: '100%' }}
        />
      </View>
    </SafeAreaView>
  );
}

// tela sobre
function SobreScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.telaContainer} edges={['bottom', 'left', 'right']}>
      <View style={styles.sobreConteudo}>
        <Text style={styles.tituloPrincipal}>Sobre o Aplicativo</Text>

        <View style={styles.cardSobre}>
          <Text style={styles.nomeApp}>Aplicativo Conversor de Moedas </Text>
          <Text style={styles.versao}>Versão 1.6.7</Text>

          <View style={styles.linhaDivisoria} />

          <Text style={styles.labelSobre}>Disciplina:</Text>
          <Text style={styles.valorSobre}>Desenvolvimento Móvel</Text>

          <Text style={styles.labelSobre}>Objetivo do Trabalho:</Text>
          <Text style={styles.valorSobre}>
            Demonstrar o consumo de API com AsyncStorage.
          </Text>

          <Text style={styles.labelSobre}>API Utilizada:</Text>
          <Text style={styles.valorSobre}>ExchangeRate-API</Text>
        </View>

        <MeuBotao
          titulo="Voltar para o Início"
          clique={() => navigation.navigate('Início')}
          style={{ width: '100%' }}
        />
      </View>
    </SafeAreaView>
  );
}

// tela moedas
function AbaMoedasScreen() {
  const [moedas, setMoedas] = useState([]);
  const [favoritas, setFavoritas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');

  // favoritos
  const carregarFavoritas = async () => {
    try {
      const dados = await AsyncStorage.getItem('moedas_favoritas');
      if (dados) {
        setFavoritas(JSON.parse(dados));
      } else {
        setFavoritas([]);
      }
    } catch (e) {
      console.log('Erro ao ler favoritas:', e);
    }
  };

  // buscar moeda
  const buscarMoedas = () => {
    setCarregando(true);
    setErro(null);

    fetch(URL_API)
      .then((resposta) => resposta.json())
      .then((dados) => {
        if (dados.result === 'success') {
          const lista = Object.keys(dados.conversion_rates).map((sigla) => ({
            codigo: sigla,
            taxa: dados.conversion_rates[sigla],
          }));
          setMoedas(lista);
        } else {
          setErro('Falha ao obter cotações da API.');
        }
      })
      .catch((err) => {
        console.log('Erro na requisição:', err);
        setErro('Erro de conexão ao carregar as moedas.');
      })
      .finally(() => {
        setCarregando(false);
      });
  };

  useEffect(() => {
    buscarMoedas();
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarFavoritas();
    }, [])
  );

  // funcao para favoritar / desfavoritar
  const alternarFavorita = async (codigo) => {
    try {
      let novaLista = [...favoritas];
      if (novaLista.includes(codigo)) {
        novaLista = novaLista.filter((item) => item !== codigo);
      } else {
        novaLista.push(codigo);
      }
      setFavoritas(novaLista);
      await AsyncStorage.setItem('moedas_favoritas', JSON.stringify(novaLista));
    } catch (e) {
      console.log('Erro ao salvar no storage:', e);
    }
  };

  const moedasFiltradas = moedas.filter((item) =>
    item.codigo.toLowerCase().includes(busca.toLowerCase())
  );

  if (carregando) {
    return (
      <View style={styles.centroCarregando}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.textoCarregando}>Carregando moedas da API...</Text>
      </View>
    );
  }

  if (erro) {
    return (
      <View style={styles.centroCarregando}>
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={styles.textoErro}>{erro}</Text>
        <MeuBotao titulo="Tentar Novamente" clique={buscarMoedas} style={{ marginTop: 10 }} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.telaContainer} edges={['bottom', 'left', 'right']}>
      <View style={styles.buscaContainer}>
        <MaterialIcons name="search" size={22} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Digite o nome da moeda ou sigla"
          value={busca}
          onChangeText={setBusca}
          style={styles.inputBusca}
          autoCapitalize="characters"
        />
        {busca.length > 0 && (
          <TouchableOpacity onPress={() => setBusca('')}>
            <MaterialIcons name="close" size={20} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.subInfo}>Total de moedas: {moedasFiltradas.length}</Text>

      <FlatList
        data={moedasFiltradas}
        keyExtractor={(item) => item.codigo}
        renderItem={({ item }) => (
          <CardMoeda
            item={item}
            isFavorita={favoritas.includes(item.codigo)}
            onToggleFavorita={alternarFavorita}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
        ListEmptyComponent={() => (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: '#94A3B8', fontSize: 15 }}>Nenhuma moeda encontrada.</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

// tela favoritos
function AbaFavoritasScreen({ navigation }) {
  const [favoritas, setFavoritas] = useState([]);
  const [cotacoes, setCotacoes] = useState({});

  const carregarFavoritas = async () => {
    try {
      const dados = await AsyncStorage.getItem('moedas_favoritas');
      const lista = dados ? JSON.parse(dados) : [];
      setFavoritas(lista);

      const res = await fetch(URL_API);
      const json = await res.json();
      if (json.result === 'success') {
        setCotacoes(json.conversion_rates);
      }
    } catch (e) {
      console.log('Erro ao ler favoritas:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarFavoritas();
    }, [])
  );

  // remover favorito
  const removerFavorita = async (codigo) => {
    try {
      const novaLista = favoritas.filter((item) => item !== codigo);
      setFavoritas(novaLista);
      await AsyncStorage.setItem('moedas_favoritas', JSON.stringify(novaLista));
    } catch (e) {
      console.log('Erro ao remover favorita:', e);
    }
  };

  const listaItens = favoritas.map((sigla) => ({
    codigo: sigla,
    taxa: cotacoes[sigla] || 0,
  }));

  return (
    <SafeAreaView style={styles.telaContainer} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1E293B' }}>
          Moedas Favoritas
        </Text>
        <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
          Total salvas: {favoritas.length}
        </Text>
      </View>

      <FlatList
        data={listaItens}
        keyExtractor={(item) => item.codigo}
        renderItem={({ item }) => (
          <CardMoeda
            item={item}
            isFavorita={true}
            onToggleFavorita={removerFavorita}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
        ListEmptyComponent={() => (
          <View style={styles.vazioContainer}>
            <Text style={styles.vazioTitulo}>Nenhuma moeda favorita ainda</Text>
            <Text style={styles.vazioDescricao}>
              Vá na aba de "Moedas" para favoritar as moedas que desejam ser favoritadas.
            </Text>
            <MeuBotao
              titulo="Ver Lista de Moedas"
              clique={() => navigation.navigate('AbaMoedas')}
              style={{ marginTop: 20 }}
            />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

function AbaConverterScreen() {
  const [origem, setOrigem] = useState('USD');
  const [destino, setDestino] = useState('BRL');
  const [valor, setValor] = useState('100');

  const [listaMoedas, setListaMoedas] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [tipoSeletor, setTipoSeletor] = useState('origem');
  const [buscaMoeda, setBuscaMoeda] = useState('');

  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);

  // lista completa da API
  useEffect(() => {
    fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/codes`)
      .then((res) => res.json())
      .then((dados) => {
        if (dados.result === 'success' && dados.supported_codes) {
          const formatadas = dados.supported_codes.map(([sigla, nome]) => ({
            codigo: sigla,
            nome: nome,
          }));
          setListaMoedas(formatadas);
        }
      })
      .catch((e) => console.log('Erro ao carregar codigos da API:', e));
  }, []);

  const abrirSeletor = (tipo) => {
    setTipoSeletor(tipo);
    setBuscaMoeda('');
    setModalAberto(true);
  };

  const selecionarMoeda = (codigo) => {
    if (tipoSeletor === 'origem') {
      setOrigem(codigo);
    } else {
      setDestino(codigo);
    }
    setModalAberto(false);
    setResultado(null);
  };

  const inverterMoedas = () => {
    const temp = origem;
    setOrigem(destino);
    setDestino(temp);
    setResultado(null);
  };

  const converterMoeda = () => {
    Keyboard.dismiss();

    const valorNumerico = parseFloat(valor.replace(',', '.'));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      setErro('Digite um valor.');
      return;
    }

    setCarregando(true);
    setErro(null);

    const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/${origem}/${destino}/${valorNumerico}`;

    fetch(url)
      .then((resposta) => resposta.json())
      .then((dados) => {
        if (dados.result === 'success') {
          setResultado({
            valorOrigem: valorNumerico,
            moedaOrigem: dados.base_code,
            valorDestino: dados.conversion_result,
            moedaDestino: dados.target_code,
            taxa: dados.conversion_rate,
          });
        } else {
          setErro('Não foi possível converter estas moedas.');
          setResultado(null);
        }
      })
      .catch((err) => {
        console.log('Erro na conversão:', err);
        setErro('Erro de conexão ao converter.');
        setResultado(null);
      })
      .finally(() => {
        setCarregando(false);
      });
  };

  const moedasFiltradas = listaMoedas.filter(
    (item) =>
      item.codigo.toLowerCase().includes(buscaMoeda.toLowerCase()) ||
      (item.nome && item.nome.toLowerCase().includes(buscaMoeda.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.telaContainer} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.linhaSeletores}>
          <TouchableOpacity
            style={styles.cardSeletor}
            onPress={() => abrirSeletor('origem')}
            activeOpacity={0.7}
          >
            <Text style={styles.labelSeletor}>De </Text>
            <View style={styles.valorSeletorRow}>
              <Text style={styles.codigoSeletor}>{origem}</Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#2563EB" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnTroca} onPress={inverterMoedas}>
            <MaterialIcons name="swap-horiz" size={28} color="#2563EB" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardSeletor}
            onPress={() => abrirSeletor('destino')}
            activeOpacity={0.7}
          >
            <Text style={styles.labelSeletor}>Para</Text>
            <View style={styles.valorSeletorRow}>
              <Text style={styles.codigoSeletor}>{destino}</Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#2563EB" />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={[styles.labelSimples, { marginTop: 20 }]}>Valor que vai ser convertido</Text>
        <TextInput
          style={styles.inputValor}
          value={valor}
          onChangeText={(txt) => {
            setValor(txt);
            setResultado(null);
          }}
          placeholder="Ex: 100"
          keyboardType="numeric"
        />

        {erro && <Text style={styles.textoErroSimples}>{erro}</Text>}


        <MeuBotao
          titulo={carregando ? 'Convertendo...' : 'Converter'}
          clique={converterMoeda}
          style={{ marginTop: 20 }}
        />

        {carregando && (
          <ActivityIndicator size="small" color="#2563EB" style={{ marginTop: 16 }} />
        )}

        {resultado && (
          <View style={styles.cardResultadoSimples}>
            <Text style={styles.resultadoTextoPrincipal}>
              {resultado.valorOrigem} {resultado.moedaOrigem} ={' '}
              <Text style={{ color: '#16A34A', fontWeight: 'bold' }}>
                {resultado.valorDestino.toFixed(2)} {resultado.moedaDestino}
              </Text>
            </Text>
            <Text style={styles.resultadoTaxaTexto}>
              Taxa de Conversão: 1 {resultado.moedaOrigem} = {resultado.taxa} {resultado.moedaDestino}
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalAberto}
        animationType="slide"
        onRequestClose={() => setModalAberto(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>
              Selecionar Moeda ({tipoSeletor === 'origem' ? 'Origem' : 'Destino'})
            </Text>
            <TouchableOpacity onPress={() => setModalAberto(false)} style={{ padding: 4 }}>
              <MaterialIcons name="close" size={26} color="#334155" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBuscaContainer}>
            <MaterialIcons name="search" size={22} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.modalBuscaInput}
              placeholder="Digite o nome da moeda ou sigla."
              value={buscaMoeda}
              onChangeText={setBuscaMoeda}
            />
          </View>

          <FlatList
            data={moedasFiltradas}
            keyExtractor={(item) => item.codigo}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => selecionarMoeda(item.codigo)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalItemCodigo}>{item.codigo}</Text>
                  <Text style={styles.modalItemNome}>{item.nome}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#E2E8F0' }} />}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function MoedasTabs({ navigation }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#2563EB' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerLeft: () => (
          <TouchableOpacity
            style={{ marginLeft: 16 }}
            onPress={() => navigation.openDrawer()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="menu" size={26} color="#ffffff" />
          </TouchableOpacity>
        ),
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 8 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold' },
      }}
    >
      <Tab.Screen
        name="AbaMoedas"
        component={AbaMoedasScreen}
        options={{
          title: 'Moedas',
          tabBarLabel: 'Moedas',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="format-list-bulleted" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AbaFavoritas"
        component={AbaFavoritasScreen}
        options={{
          title: 'Favoritas',
          tabBarLabel: 'Favoritas',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="star" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AbaConverter"
        component={AbaConverterScreen}
        options={{
          title: 'Converter',
          tabBarLabel: 'Converter',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="currency-exchange" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// drawer navigator
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Drawer.Navigator
          initialRouteName="Início"
          screenOptions={{
            headerStyle: { backgroundColor: '#2563EB' },
            headerTintColor: '#ffffff',
            drawerActiveTintColor: '#2563EB',
            drawerInactiveTintColor: '#64748B',
            drawerLabelStyle: { fontSize: 15, fontWeight: '600' },
          }}
        >
          <Drawer.Screen
            name="Início"
            component={InicioScreen}
            options={{
              drawerLabel: 'Início',
              drawerIcon: ({ color, size }) => (
                <MaterialIcons name="home" size={size} color={color} />
              ),
            }}
          />

          <Drawer.Screen
            name="Sobre"
            component={SobreScreen}
            options={{
              drawerLabel: 'Sobre',
              drawerIcon: ({ color, size }) => (
                <MaterialIcons name="info" size={size} color={color} />
              ),
            }}
          />

          <Drawer.Screen
            name="Moedas"
            component={MoedasTabs}
            options={{
              drawerLabel: 'Moedas',
              drawerIcon: ({ color, size }) => (
                <MaterialIcons name="attach-money" size={size} color={color} />
              ),
              headerShown: false, 
            }}
          />
        </Drawer.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  telaContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  btnPadrao: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTexto: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardMoeda: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginVertical: 4,
    marginHorizontal: 16,
  },
  cardCodigo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  cardTaxa: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  inicioConteudo: {
    flex: 1,
    padding: 24,
    justifyContent: 'Flex-start',
    alignItems: 'center',
    paddingTop: 30,
  },
  iconeCirculo: {
    marginBottom: 20,
    backgroundColor: '#EFF6FF',
    padding: 20,
    borderRadius: 50,
  },
  tituloPrincipal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 10,
    textAlign: 'center',
  },
  descricaoInicio: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  cardObjetivo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 10,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardObjetivoTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8,
  },
  itemObjetivo: {
    fontSize: 14,
    color: '#475569',
    marginVertical: 2,
  },
  sobreConteudo: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 30,
  },
  cardSobre: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  nomeApp: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
    textAlign: 'center',
  },
  versao: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 10,
  },
  linhaDivisoria: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  labelSobre: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 8,
  },
  valorSobre: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 20,
  },
  centroCarregando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  textoCarregando: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748B',
  },
  textoErro: {
    marginTop: 10,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 10,
  },
  buscaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputBusca: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
  },
  subInfo: {
    marginHorizontal: 16,
    marginBottom: 8,
    fontSize: 13,
    color: '#64748B',
  },
  vazioContainer: {
    padding: 30,
    alignItems: 'center',
    marginTop: 30,
  },
  vazioTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 12,
  },
  vazioDescricao: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  linhaSeletores: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardSeletor: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  labelSeletor: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
    marginBottom: 2,
  },
  valorSeletorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codigoSeletor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  btnTroca: {
    padding: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  labelSimples: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 6,
  },
  inputValor: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  textoErroSimples: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 8,
  },
  cardResultadoSimples: {
    backgroundColor: '#FFFFFF',
    marginTop: 24,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    alignItems: 'center',
  },
  resultadoTextoPrincipal: {
    fontSize: 20,
    color: '#1E293B',
    marginBottom: 6,
    textAlign: 'center',
  },
  resultadoTaxaTexto: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  modalTitulo: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  modalBuscaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modalBuscaInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  modalItemCodigo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  modalItemNome: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },

});

registerRootComponent(App);