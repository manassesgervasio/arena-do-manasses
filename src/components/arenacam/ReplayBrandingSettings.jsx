import { useEffect, useMemo, useRef, useState } from "react";
import {
  ARENACAM_LOGO_POSICOES,
  ARENACAM_LOGO_TIPOS,
  atualizarLogoArena,
  criarLogoArena,
  excluirLogoArena,
  listarLogosArena,
  validarArquivoLogo,
} from "../../services/arenacamLogosService";
import { Button, Card, Input, Select } from "../ui";

const LIMITE_PATROCINADORES = 5;

export default function ReplayBrandingSettings({ contextoArena }) {
  const arenaAtual = contextoArena?.arenaAtual;
  const arenaId = arenaAtual?.id || "";
  const arenaInputRef = useRef(null);
  const patrocinadorInputRef = useRef(null);
  const [logos, setLogos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [operacao, setOperacao] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [patrocinadorNome, setPatrocinadorNome] = useState("");
  const [patrocinadorPosicao, setPatrocinadorPosicao] = useState("bottom-right");
  const [patrocinadorArquivo, setPatrocinadorArquivo] = useState(null);

  const logoArena = useMemo(
    () => logos.find((logo) => logo.tipo === ARENACAM_LOGO_TIPOS.ARENA) || null,
    [logos]
  );
  const patrocinadores = useMemo(
    () => logos.filter((logo) => logo.tipo === ARENACAM_LOGO_TIPOS.PATROCINADOR),
    [logos]
  );
  const enviando = Boolean(operacao);

  useEffect(() => {
    let ativo = true;

    async function carregarLogos() {
      if (!arenaId) {
        setLogos([]);
        setErro("");
        setMensagem("");
        return;
      }

      setCarregando(true);
      setErro("");

      try {
        const logosCarregadas = await listarLogosArena(arenaId);

        if (!ativo) return;

        setLogos(logosCarregadas);
      } catch (error) {
        if (!ativo) return;

        setLogos([]);
        setErro(error?.message || "Não foi possível carregar as logos.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarLogos();

    return () => {
      ativo = false;
    };
  }, [arenaId]);

  async function enviarLogoArena(event) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) return;

    await executarOperacao("arena-upload", async () => {
      validarArquivoLogo(arquivo, arenaId);

      const logoAtualizada = logoArena
        ? await atualizarLogoArena({
            arenaId,
            logo: logoArena,
            campos: {
              nome: logoArena.nome || arenaAtual?.nome || "Logo da arena",
            },
            arquivo,
          })
        : await criarLogoArena({
            arenaId,
            tipo: ARENACAM_LOGO_TIPOS.ARENA,
            nome: arenaAtual?.nome || "Logo da arena",
            posicao: "bottom-right",
            arquivo,
          });

      atualizarLogoNoEstado(logoAtualizada);
      setMensagem(logoArena ? "Logo da arena atualizada." : "Logo da arena adicionada.");
    });

    if (arenaInputRef.current) arenaInputRef.current.value = "";
  }

  async function adicionarPatrocinador(event) {
    event.preventDefault();

    if (patrocinadores.length >= LIMITE_PATROCINADORES) {
      setErro("Limite de 5 patrocinadores atingido.");
      return;
    }

    await executarOperacao("patrocinador-upload", async () => {
      const nome = patrocinadorNome.trim();

      if (!nome) {
        throw new Error("Informe o nome do patrocinador.");
      }

      validarArquivoLogo(patrocinadorArquivo, arenaId);

      const novaLogo = await criarLogoArena({
        arenaId,
        tipo: ARENACAM_LOGO_TIPOS.PATROCINADOR,
        nome,
        posicao: patrocinadorPosicao,
        arquivo: patrocinadorArquivo,
        ordem: patrocinadores.length,
      });

      setLogos((atuais) => [...atuais, novaLogo]);
      setPatrocinadorNome("");
      setPatrocinadorPosicao("bottom-right");
      setPatrocinadorArquivo(null);
      if (patrocinadorInputRef.current) patrocinadorInputRef.current.value = "";
      setMensagem("Patrocinador adicionado.");
    });
  }

  async function atualizarAtivo(logo, ativo) {
    await executarOperacao(`ativo-${logo.id}`, async () => {
      const atualizada = await atualizarLogoArena({
        arenaId,
        logo,
        campos: { ativo },
      });

      atualizarLogoNoEstado(atualizada);
      setMensagem(ativo ? "Logo ativada." : "Logo desativada.");
    });
  }

  async function atualizarPosicao(logo, posicao) {
    await executarOperacao(`posicao-${logo.id}`, async () => {
      const atualizada = await atualizarLogoArena({
        arenaId,
        logo,
        campos: { posicao },
      });

      atualizarLogoNoEstado(atualizada);
      setMensagem("Posição atualizada.");
    });
  }

  async function excluirLogo(logo) {
    const confirmou = window.confirm(`Excluir ${logo.nome}?`);

    if (!confirmou) return;

    await executarOperacao(`excluir-${logo.id}`, async () => {
      await excluirLogoArena(logo, arenaId);
      setLogos((atuais) => atuais.filter((item) => item.id !== logo.id));
      setMensagem("Logo excluída.");
    });
  }

  async function executarOperacao(chave, callback) {
    setOperacao(chave);
    setErro("");
    setMensagem("");

    try {
      await callback();
    } catch (error) {
      setErro(error?.message || "Não foi possível concluir a operação.");
    } finally {
      setOperacao("");
    }
  }

  function atualizarLogoNoEstado(logoAtualizada) {
    setLogos((atuais) => {
      const existe = atuais.some((logo) => logo.id === logoAtualizada.id);

      if (!existe) return [logoAtualizada, ...atuais];

      return atuais.map((logo) =>
        logo.id === logoAtualizada.id ? logoAtualizada : logo
      );
    });
  }

  return (
    <section className="replay-branding-settings">
      <div className="replay-branding-header">
        <div>
          <h3>Personalização dos Replays</h3>
          <p>
            Adicione a marca da sua arena e dos patrocinadores que poderão
            aparecer nos replays do ArenaCam.
          </p>
        </div>
      </div>

      {carregando && (
        <div className="configuracoes-arena-success">Carregando logos...</div>
      )}

      {mensagem && <div className="configuracoes-arena-success">{mensagem}</div>}
      {erro && <div className="configuracoes-arena-error">{erro}</div>}

      <div className="replay-branding-grid">
        <Card className="replay-branding-card">
          <div className="replay-branding-card-header">
            <div>
              <span>ArenaCam</span>
              <h4>Logo da Arena</h4>
            </div>
            {logoArena && (
              <LogoStatusToggle
                logo={logoArena}
                disabled={enviando}
                onChange={atualizarAtivo}
              />
            )}
          </div>

          <LogoPreview logo={logoArena} fallback="Logo da arena" />

          {logoArena && (
            <label className="replay-branding-field">
              <span>Posição</span>
              <Select
                value={logoArena.posicao}
                disabled={enviando}
                onChange={(event) => atualizarPosicao(logoArena, event.target.value)}
              >
                {ARENACAM_LOGO_POSICOES.map((posicao) => (
                  <option key={posicao.value} value={posicao.value}>
                    {posicao.label}
                  </option>
                ))}
              </Select>
            </label>
          )}

          <label className="replay-branding-upload">
            <span>{logoArena ? "Trocar imagem" : "Enviar logo da arena"}</span>
            <input
              ref={arenaInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={enviando}
              onChange={enviarLogoArena}
            />
          </label>

          {logoArena && (
            <Button
              type="button"
              className="replay-branding-danger"
              disabled={enviando}
              onClick={() => excluirLogo(logoArena)}
            >
              Excluir logo
            </Button>
          )}
        </Card>

        <Card className="replay-branding-card">
          <div className="replay-branding-card-header">
            <div>
              <span>Patrocinadores</span>
              <h4>Logos de patrocinadores</h4>
            </div>
            <strong>
              {patrocinadores.length} de {LIMITE_PATROCINADORES} patrocinadores
            </strong>
          </div>

          <form className="replay-branding-sponsor-form" onSubmit={adicionarPatrocinador}>
            <label className="replay-branding-field">
              <span>Nome do patrocinador</span>
              <Input
                value={patrocinadorNome}
                disabled={enviando || patrocinadores.length >= LIMITE_PATROCINADORES}
                onChange={(event) => setPatrocinadorNome(event.target.value)}
                placeholder="Ex: Patrocinador Master"
              />
            </label>

            <label className="replay-branding-field">
              <span>Posição</span>
              <Select
                value={patrocinadorPosicao}
                disabled={enviando || patrocinadores.length >= LIMITE_PATROCINADORES}
                onChange={(event) => setPatrocinadorPosicao(event.target.value)}
              >
                {ARENACAM_LOGO_POSICOES.map((posicao) => (
                  <option key={posicao.value} value={posicao.value}>
                    {posicao.label}
                  </option>
                ))}
              </Select>
            </label>

            <label className="replay-branding-upload">
              <span>Upload da logo</span>
              <input
                ref={patrocinadorInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={enviando || patrocinadores.length >= LIMITE_PATROCINADORES}
                onChange={(event) =>
                  setPatrocinadorArquivo(event.target.files?.[0] || null)
                }
              />
            </label>

            <Button
              type="submit"
              variant="primary"
              disabled={enviando || patrocinadores.length >= LIMITE_PATROCINADORES}
            >
              {operacao === "patrocinador-upload"
                ? "Enviando..."
                : "Adicionar patrocinador"}
            </Button>
          </form>

          <div className="replay-branding-list">
            {patrocinadores.length === 0 ? (
              <div className="replay-branding-empty">
                Nenhum patrocinador cadastrado.
              </div>
            ) : (
              patrocinadores.map((logo) => (
                <LogoItem
                  key={logo.id}
                  logo={logo}
                  disabled={enviando}
                  onAtivoChange={atualizarAtivo}
                  onPosicaoChange={atualizarPosicao}
                  onExcluir={excluirLogo}
                />
              ))
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}

function LogoPreview({ logo, fallback }) {
  return (
    <div className="replay-branding-preview">
      {logo?.preview_url ? (
        <img src={logo.preview_url} alt={logo.nome} />
      ) : (
        <span>{fallback}</span>
      )}
    </div>
  );
}

function LogoItem({ logo, disabled, onAtivoChange, onPosicaoChange, onExcluir }) {
  return (
    <article className="replay-branding-logo-item">
      <LogoPreview logo={logo} fallback={logo.nome} />
      <div className="replay-branding-logo-content">
        <div className="replay-branding-logo-title">
          <strong>{logo.nome}</strong>
          <LogoStatusToggle
            logo={logo}
            disabled={disabled}
            onChange={onAtivoChange}
          />
        </div>
        <label className="replay-branding-field">
          <span>Posição</span>
          <Select
            value={logo.posicao}
            disabled={disabled}
            onChange={(event) => onPosicaoChange(logo, event.target.value)}
          >
            {ARENACAM_LOGO_POSICOES.map((posicao) => (
              <option key={posicao.value} value={posicao.value}>
                {posicao.label}
              </option>
            ))}
          </Select>
        </label>
        <Button
          type="button"
          className="replay-branding-danger"
          disabled={disabled}
          onClick={() => onExcluir(logo)}
        >
          Excluir
        </Button>
      </div>
    </article>
  );
}

function LogoStatusToggle({ logo, disabled, onChange }) {
  return (
    <label className="replay-branding-toggle">
      <input
        type="checkbox"
        checked={Boolean(logo.ativo)}
        disabled={disabled}
        onChange={(event) => onChange(logo, event.target.checked)}
      />
      <span>{logo.ativo ? "Ativa" : "Inativa"}</span>
    </label>
  );
}
