import { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/screen";
import { LogoCompleta } from "@/components/logo-completa";
import { Texto } from "@/components/texto";
import { useTema } from "@/theme/tema";
import { useAuth } from "@/stores/use-auth";
import type { Cores } from "@/theme/colors";

export default function LoginScreen() {
  const { cores, escala } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);
  const { entrar, criarConta, entrando, erro } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [modoCriar, setModoCriar] = useState(false);
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [avisoEmail, setAvisoEmail] = useState<string | null>(null);
  const [emailFocado, setEmailFocado] = useState(false);
  const [senhaFocada, setSenhaFocada] = useState(false);

  const aoEntrar = async () => {
    if (!email || !senha) {
      return;
    }
    await entrar(email, senha);
  };

  const aoCriarConta = async () => {
    if (!email || !senha || !confirmarSenha) {
      return;
    }
    if (senha !== confirmarSenha) {
      setAvisoEmail("As senhas não coincidem");
      return;
    }
    await criarConta(email, senha);
    // só reseta estado se signup foi bem-sucedido (erro = null)
    if (!erro) {
      setAvisoEmail("Verifique seu e-mail para confirmar o cadastro");
      setEmail("");
      setSenha("");
      setConfirmarSenha("");
      setTimeout(() => setModoCriar(false), 2000);
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* CABEÇALHO HERO */}
        <View style={styles.heroBand}>
          <LogoCompleta largura={232} cor="#ffffff" />
          <Texto style={styles.titulo}>Bem-vindo de volta</Texto>
          <Texto style={styles.subtitulo}>
            Faça login para acessar seus serviços.
          </Texto>
        </View>

        {/* FORMULÁRIO */}
        <View style={styles.formContainer}>

          {/* Aviso ou erro */}
          {(erro || avisoEmail) && (
            <View
              style={[
                styles.avisoCard,
                { backgroundColor: erro ? cores.coral + "20" : cores.verde + "15" },
              ]}
            >
              <Ionicons
                name={erro ? "alert-circle-outline" : "checkmark-circle-outline"}
                size={16}
                color={erro ? cores.coral : cores.verde}
              />
              <Texto
                style={{
                  fontSize: 13,
                  color: erro ? cores.coral : cores.verde,
                  flex: 1,
                }}
              >
                {erro || avisoEmail}
              </Texto>
            </View>
          )}

          {/* E-mail */}
          <View style={styles.inputGroup}>
            <Texto style={styles.label}>E-mail</Texto>
            <View
              style={[
                styles.searchBox,
                emailFocado && { borderColor: cores.verde, borderWidth: 2 },
              ]}
            >
              <Ionicons name="mail-outline" size={20} color={cores.inkFaint} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocado(true)}
                onBlur={() => setEmailFocado(false)}
                placeholder="seu@email.com"
                placeholderTextColor={cores.inkFaint}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!entrando}
                style={[styles.input, { fontSize: 15 * escala }]}
              />
            </View>
          </View>

          {/* Senha */}
          <View style={styles.inputGroup}>
            <Texto style={styles.label}>Senha</Texto>
            <View
              style={[
                styles.searchBox,
                senhaFocada && { borderColor: cores.verde, borderWidth: 2 },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={cores.inkFaint}
              />
              <TextInput
                value={senha}
                onChangeText={setSenha}
                onFocus={() => setSenhaFocada(true)}
                onBlur={() => setSenhaFocada(false)}
                placeholder="Sua senha"
                placeholderTextColor={cores.inkFaint}
                secureTextEntry={!mostrarSenha}
                editable={!entrando}
                style={[styles.input, { fontSize: 15 * escala }]}
              />
              <Pressable
                onPress={() => setMostrarSenha(!mostrarSenha)}
                hitSlop={10}
                disabled={entrando}
                accessibilityRole="button"
                accessibilityLabel={
                  mostrarSenha ? "Ocultar senha" : "Mostrar senha"
                }
              >
                <Ionicons
                  name={mostrarSenha ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={cores.inkFaint}
                />
              </Pressable>
            </View>
          </View>

          {/* Confirmar senha (só em modo criar) */}
          {modoCriar && (
            <View style={styles.inputGroup}>
              <Texto style={styles.label}>Confirmar Senha</Texto>
              <View style={styles.searchBox}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={cores.inkFaint}
                />
                <TextInput
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  placeholder="Confirme sua senha"
                  placeholderTextColor={cores.inkFaint}
                  secureTextEntry={!mostrarConfirmar}
                  editable={!entrando}
                  style={[styles.input, { fontSize: 15 * escala }]}
                />
                <Pressable
                  onPress={() => setMostrarConfirmar(!mostrarConfirmar)}
                  hitSlop={10}
                  disabled={entrando}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={mostrarConfirmar ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={cores.inkFaint}
                  />
                </Pressable>
              </View>
            </View>
          )}

          {/* Botões de ação */}
          {!modoCriar && (
            <>
              <Pressable
                style={styles.esqueciBotao}
                disabled={entrando}
                accessibilityRole="button"
              >
                <Texto style={[styles.esqueciTexto, { opacity: entrando ? 0.5 : 1 }]}>
                  Esqueci minha senha
                </Texto>
              </Pressable>

              <Pressable
                style={[
                  styles.btnEntrar,
                  { opacity: entrando ? 0.7 : 1 },
                ]}
                onPress={aoEntrar}
                disabled={entrando}
                accessibilityRole="button"
              >
                {entrando ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Texto style={styles.btnEntrarTexto}>Entrar</Texto>
                )}
              </Pressable>
            </>
          )}

          {modoCriar && (
            <Pressable
              style={[styles.btnEntrar, { opacity: entrando ? 0.7 : 1 }]}
              onPress={aoCriarConta}
              disabled={entrando}
              accessibilityRole="button"
            >
              {entrando ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Texto style={styles.btnEntrarTexto}>Criar conta</Texto>
              )}
            </Pressable>
          )}

          {/* Toggle criar / entrar */}
          <Pressable
            onPress={() => {
              setModoCriar(!modoCriar);
              setAvisoEmail(null);
              setEmail("");
              setSenha("");
              setConfirmarSenha("");
            }}
            disabled={entrando}
          >
            <Texto style={[styles.toggleModo, { opacity: entrando ? 0.5 : 1 }]}>
              {modoCriar
                ? "Já tem conta? Faça login"
                : "Ainda não tem conta? Crie uma"}
            </Texto>
          </Pressable>

          {/* Gov.br abaixo */}
          <View style={styles.divisor}>
            <View style={styles.linhaDivisora} />
            <Texto style={styles.textoDivisor}>ou</Texto>
            <View style={styles.linhaDivisora} />
          </View>

          <Pressable
            style={[styles.btnGovbr, { opacity: 0.5 }]}
            disabled
            accessibilityRole="button"
          >
            <Ionicons name="finger-print-outline" size={24} color="#ffffff" />
            <View>
              <Texto style={styles.btnGovbrTexto}>Entrar com gov.br</Texto>
              <Texto style={{ fontSize: 11, color: "#ffffff", opacity: 0.7 }}>
                Em breve
              </Texto>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (cores: Cores) =>
  StyleSheet.create({
    scroll: {
      flexGrow: 1,
      backgroundColor: cores.paper,
    },
    heroBand: {
      backgroundColor: cores.verdeDeep,
      paddingHorizontal: 24,
      paddingTop: 40,
      paddingBottom: 36,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      alignItems: "flex-start",
      width: "100%",
    },
    titulo: {
      fontSize: 32,
      fontWeight: "800",
      color: "#ffffff",
      lineHeight: 38,
      marginTop: 18,
      marginBottom: 8,
    },
    subtitulo: {
      fontSize: 16,
      color: "#ffffff",
    },
    formContainer: {
      padding: 24,
      gap: 20,
    },
    btnGovbr: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#1351b4", // Azul do GOV.BR
      paddingVertical: 16,
      borderRadius: 16,
      gap: 12,
    },
    btnGovbrTexto: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "700",
    },
    divisor: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 10,
    },
    linhaDivisora: {
      flex: 1,
      height: 1,
      backgroundColor: cores.line,
    },
    textoDivisor: {
      marginHorizontal: 14,
      fontSize: 14,
      color: cores.inkFaint,
    },
    inputGroup: {
      gap: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: cores.inkSoft,
      marginLeft: 4,
    },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: "#ffffff",
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: cores.line,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: cores.ink,
      padding: 0,
    },
    esqueciBotao: {
      alignSelf: "flex-end",
    },
    esqueciTexto: {
      fontSize: 14,
      color: cores.verdeBright,
      fontWeight: "600",
    },
    btnEntrar: {
      backgroundColor: cores.verde,
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: "center",
      marginTop: 8,
      marginBottom: 32,
    },
    btnEntrarTexto: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "700",
    },
    rodape: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
      marginTop: "auto",
      paddingVertical: 30,
    },
    rodapeTexto: {
      fontSize: 15,
      color: cores.inkSoft,
    },
    criarContaLink: {
      fontSize: 15,
      color: cores.verdeBright,
      fontWeight: "700",
    },
    avisoCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 8,
    },
    toggleModo: {
      fontSize: 14,
      color: cores.verdeBright,
      fontWeight: "600",
      textAlign: "center",
      marginTop: 16,
    },
  });
