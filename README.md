# fin-mvp

Aplicativo de finanças pessoais feito em Expo/React Native.

## Visao geral
- Controle de transacoes por categoria
- Categorias com campos personalizados
- Resumo por categoria com metricas basicas e personalizadas
- Perfil com foto e dados salvos localmente

## Principais telas
- Home: resumo do mes e top categorias
- Transacoes: lista, filtros e edicao
- Categorias: criacao e configuracao de campos e metricas
- Perfil: dados do usuario e foto

## Como rodar
```bash
npm install
npm run start
```

## Dicas
- Para criar metricas personalizadas, use campos numericos e a variavel `valor`.
- Exemplo de formula: `(km_atual - km_anterior) / litros`

## Tecnologias
- Expo SDK 54
- React Native 0.81
- React Navigation
- SQLite (expo-sqlite)
- AsyncStorage
