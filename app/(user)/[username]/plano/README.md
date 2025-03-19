# Parental Agreement Form: Education Section

## Educação Regular<

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acordo Parental - Educação Regular</title>
</head>
<body>
    <form id="parental-agreement">
        <h1>Acordo Parental</h1>
        
        <fieldset>
            <legend><h2>1. Educação Regular</h2></legend>
            
            <div>
                <label for="school">1.1. Em que escola o menor estuda:</label>
                <input type="text" id="school" name="school">
            </div>
            
            <div>
                <p>1.2. Quem será o responsável financeiro pelo pagamento das mensalidades?</p>
                <input type="radio" id="tuition-father" name="tuition-responsible" value="pai">
                <label for="tuition-father">Pai</label><br>
                
                <input type="radio" id="tuition-mother" name="tuition-responsible" value="mae">
                <label for="tuition-mother">Mãe</label><br>
                
                <input type="radio" id="tuition-public" name="tuition-responsible" value="publica">
                <label for="tuition-public">Escola pública</label>
            </div>
            
            <div>
                <p>1.3. Quem arcará com os custos de:</p>
                
                <div>
                    <p>- Material escolar</p>
                    <input type="radio" id="supplies-father" name="supplies-responsible" value="pai">
                    <label for="supplies-father">Pai</label><br>
                    
                    <input type="radio" id="supplies-mother" name="supplies-responsible" value="mae">
                    <label for="supplies-mother">Mãe</label><br>
                    
                    <input type="radio" id="supplies-divided" name="supplies-responsible" value="dividido">
                    <label for="supplies-divided">Será dividido</label>
                    <label for="supplies-percentage">(em que porcentagem?)</label>
                    <input type="text" id="supplies-percentage" name="supplies-percentage" placeholder="Ex: Pai 70%, Mãe 30%">
                </div>
                
                <div>
                    <p>- Fardamento</p>
                    <input type="radio" id="uniform-father" name="uniform-responsible" value="pai">
                    <label for="uniform-father">Pai</label><br>
                    
                    <input type="radio" id="uniform-mother" name="uniform-responsible" value="mae">
                    <label for="uniform-mother">Mãe</label><br>
                    
                    <input type="radio" id="uniform-divided" name="uniform-responsible" value="dividido">
                    <label for="uniform-divided">Será dividido</label>
                    <label for="uniform-percentage">(em que porcentagem?)</label>
                    <input type="text" id="uniform-percentage" name="uniform-percentage" placeholder="Ex: Pai 70%, Mãe 30%">
                </div>
                
                <div>
                    <p>- Apostilas</p>
                    <input type="radio" id="books-father" name="books-responsible" value="pai">
                    <label for="books-father">Pai</label><br>
                    
                    <input type="radio" id="books-mother" name="books-responsible" value="mae">
                    <label for="books-mother">Mãe</label><br>
                    
                    <input type="radio" id="books-divided" name="books-responsible" value="dividido">
                    <label for="books-divided">Será dividido</label>
                    <label for="books-percentage">(em que porcentagem?)</label>
                    <input type="text" id="books-percentage" name="books-percentage" placeholder="Ex: Pai 70%, Mãe 30%">
                </div>
                
                <div>
                    <p>- Atividades Extras propostas pela escola</p>
                    <input type="radio" id="activities-father" name="activities-responsible" value="pai">
                    <label for="activities-father">Pai</label><br>
                    
                    <input type="radio" id="activities-mother" name="activities-responsible" value="mae">
                    <label for="activities-mother">Mãe</label><br>
                    
                    <input type="radio" id="activities-divided" name="activities-responsible" value="dividido">
                    <label for="activities-divided">Será dividido</label>
                    <label for="activities-percentage">(em que porcentagem?)</label>
                    <input type="text" id="activities-percentage" name="activities-percentage" placeholder="Ex: Pai 70%, Mãe 30%">
                </div>
                
                <div>
                    <p>- Excursões</p>
                    <input type="radio" id="excursions-father" name="excursions-responsible" value="pai">
                    <label for="excursions-father">Pai</label><br>
                    
                    <input type="radio" id="excursions-mother" name="excursions-responsible" value="mae">
                    <label for="excursions-mother">Mãe</label><br>
                    
                    <input type="radio" id="excursions-divided" name="excursions-responsible" value="dividido">
                    <label for="excursions-divided">Será dividido</label>
                    <label for="excursions-percentage">(em que porcentagem?)</label>
                    <input type="text" id="excursions-percentage" name="excursions-percentage" placeholder="Ex: Pai 70%, Mãe 30%">
                </div>
            </div>
            
            <div>
                <p>1.4. Quem a escola deverá contatar em caso de emergência?</p>
                <input type="radio" id="emergency-father" name="emergency-contact" value="pai">
                <label for="emergency-father">Pai</label><br>
                
                <input type="radio" id="emergency-mother" name="emergency-contact" value="mae">
                <label for="emergency-mother">Mãe</label><br>
                
                <input type="radio" id="emergency-other" name="emergency-contact" value="outro">
                <label for="emergency-other">Outro</label>
                <label for="emergency-who">(quem?)</label>
                <input type="text" id="emergency-who" name="emergency-who">
            </div>
            
            <div>
                <p>1.5. Se for necessária a contratação de transporte escolar, quem arcará com os custos?</p>
                <input type="radio" id="transport-father" name="transport-responsible" value="pai">
                <label for="transport-father">Pai</label><br>
                
                <input type="radio" id="transport-mother" name="transport-responsible" value="mae">
                <label for="transport-mother">Mãe</label>
            </div>
            
            <div>
                <p>1.6. Se for preciso contratar um professor particular, quem decidirá?</p>
                <input type="radio" id="tutor-decision-together" name="tutor-decision" value="conjunto">
                <label for="tutor-decision-together">Em conjunto</label><br>
                
                <input type="radio" id="tutor-decision-father" name="tutor-decision" value="pai">
                <label for="tutor-decision-father">Pai</label><br>
                
                <input type="radio" id="tutor-decision-mother" name="tutor-decision" value="mae">
                <label for="tutor-decision-mother">Mãe</label>
                
                <p>- Quem será responsável pelo pagamento?</p>
                <input type="radio" id="tutor-payment-father" name="tutor-payment" value="pai">
                <label for="tutor-payment-father">Pai</label><br>
                
                <input type="radio" id="tutor-payment-mother" name="tutor-payment" value="mae">
                <label for="tutor-payment-mother">Mãe</label><br>
                
                <input type="radio" id="tutor-payment-divided" name="tutor-payment" value="dividido">
                <label for="tutor-payment-divided">Será dividido</label>
                <label for="tutor-percentage">(em que porcentagem?)</label>
                <input type="text" id="tutor-percentage" name="tutor-percentage" placeholder="Ex: Pai 70%, Mãe 30%">
            </div>
            
            <div>
                <p>1.7. No que se refere à família extensa (avós, tios, madrastas, padrastos), eles estão autorizados a transportar o menor ou assinar documentos na escola?</p>
                <input type="radio" id="extended-family-yes" name="extended-family-school" value="sim">
                <label for="extended-family-yes">Sim</label><br>
                
                <input type="radio" id="extended-family-no" name="extended-family-school" value="nao">
                <label for="extended-family-no">Não</label>
                
                <p>- E nas atividades extracurriculares?</p>
                <input type="radio" id="extended-family-activities-yes" name="extended-family-activities" value="sim">
                <label for="extended-family-activities-yes">Sim</label><br>
                
                <input type="radio" id="extended-family-activities-no" name="extended-family-activities" value="nao">
                <label for="extended-family-activities-no">Não</label>
            </div>
            
            <div>
                <p>1.8. Em festas escolares, os genitores:</p>
                <input type="radio" id="school-events-both" name="school-events" value="ambos">
                <label for="school-events-both">Ambos participarão sempre</label><br>
                
                <input type="radio" id="school-events-alternate" name="school-events" value="revezamento">
                <label for="school-events-alternate">Se revezarão (participando somente nas atividades em sua homenagem e revezando-se anualmente naquelas que o protagonista é a criança)</label>
            </div>
        </fieldset>
    </form>
</body>
</html>
```

## Atividades Extracurriculares

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acordo Parental - Atividades Extracurriculares</title>
</head>
<body>
    <form id="parental-agreement">
        <h1>Acordo Parental</h1>
        
        <fieldset>
            <legend><h2>2. Atividades Extracurriculares</h2></legend>
            
            <div>
                <label for="extracurricular-activity">2.1. Qual atividade extracurricular o menor faz?</label>
                <input type="text" id="extracurricular-activity" name="extracurricular-activity" placeholder="(possibilidade de incluir mais de uma atividade)">
            </div>
            
            <div>
                <p>2.2. Quem será responsável por levar e buscar o menor na atividade extracurricular?</p>
                <input type="radio" id="transport-father" name="extracurricular-transport" value="pai">
                <label for="transport-father">Pai</label><br>
                
                <input type="radio" id="transport-mother" name="extracurricular-transport" value="mae">
                <label for="transport-mother">Mãe</label><br>
                
                <input type="radio" id="transport-support" name="extracurricular-transport" value="rede-apoio">
                <label for="transport-support">Alguém da rede de apoio</label>
                <label for="transport-who">(quem)</label>
                <input type="text" id="transport-who" name="transport-who"><br>
                
                <input type="radio" id="transport-driver" name="extracurricular-transport" value="motorista">
                <label for="transport-driver">Motorista terceirizado</label>
                <label for="driver-payment">(nesse caso quem paga?)</label>
                <input type="text" id="driver-payment" name="driver-payment">
            </div>
            
            <div>
                <p>2.3. Quem será o responsável financeiro pelo custo da mensalidade da atividade?</p>
                <input type="radio" id="monthly-father" name="extracurricular-monthly" value="pai">
                <label for="monthly-father">Pai</label><br>
                
                <input type="radio" id="monthly-mother" name="extracurricular-monthly" value="mae">
                <label for="monthly-mother">Mãe</label><br>
                
                <input type="radio" id="monthly-divided" name="extracurricular-monthly" value="dividido">
                <label for="monthly-divided">Dividido</label>
                <label for="monthly-percentage">(em que porcentagem?)</label>
                <input type="text" id="monthly-percentage" name="monthly-percentage" placeholder="Ex: Pai 70%, Mãe 30%">
            </div>
            
            <div>
                <p>2.4. Quem arcará com material, fardamento e eventuais despesas extras?</p>
                <input type="radio" id="extras-father" name="extracurricular-extras" value="pai">
                <label for="extras-father">Pai</label><br>
                
                <input type="radio" id="extras-mother" name="extracurricular-extras" value="mae">
                <label for="extras-mother">Mãe</label><br>
                
                <input type="radio" id="extras-divided" name="extracurricular-extras" value="dividido">
                <label for="extras-divided">Dividido</label>
                <label for="extras-percentage">(em que porcentagem?)</label>
                <input type="text" id="extras-percentage" name="extras-percentage" placeholder="Ex: Pai 70%, Mãe 30%">
                
                <p>- Quem será responsável pelo pagamento em caso de perda ou substituição de equipamento?</p>
                <input type="radio" id="equipment-father" name="equipment-replacement" value="pai">
                <label for="equipment-father">Pai</label><br>
                
                <input type="radio" id="equipment-mother" name="equipment-replacement" value="mae">
                <label for="equipment-mother">Mãe</label><br>
                
                <input type="radio" id="equipment-divided" name="equipment-replacement" value="dividido">
                <label for="equipment-divided">Dividido</label>
                <label for="equipment-percentage">(em que porcentagem?)</label>
                <input type="text" id="equipment-percentage" name="equipment-percentage" placeholder="Ex: Pai 70%, Mãe 30%">
            </div>
            
            <div>
                <p>2.5. Em caso de emergência, a quem deve ser comunicada qualquer intercorrência?</p>
                <input type="radio" id="emergency-father" name="extracurricular-emergency" value="pai">
                <label for="emergency-father">Pai</label><br>
                
                <input type="radio" id="emergency-mother" name="extracurricular-emergency" value="mae">
                <label for="emergency-mother">Mãe</label><br>
                
                <input type="radio" id="emergency-support" name="extracurricular-emergency" value="rede-apoio">
                <label for="emergency-support">Alguém da rede de apoio?</label>
                <label for="emergency-who">Quem:</label>
                <input type="text" id="emergency-who" name="emergency-who">
            </div>
            
            <div>
                <p>2.6. Se for necessário transporte particular, quem arcará com os custos?</p>
                <input type="radio" id="transport-cost-father" name="transport-cost" value="pai">
                <label for="transport-cost-father">Pai</label><br>
                
                <input type="radio" id="transport-cost-mother" name="transport-cost" value="mae">
                <label for="transport-cost-mother">Mãe</label><br>
                
                <input type="radio" id="transport-cost-divided" name="transport-cost" value="dividido">
                <label for="transport-cost-divided">Dividido</label>
                <label for="transport-percentage">(em que porcentagem?)</label>
                <input type="text" id="transport-percentage" name="transport-percentage" placeholder="Ex: Pai 70%, Mãe 30%">
            </div>
            
            <div>
                <p>2.7. No caso de apresentações, competições ou aulas expositivas, ambos os genitores poderão participar ou se revezarão?</p>
                <input type="radio" id="events-both" name="extracurricular-events" value="ambos">
                <label for="events-both">Ambos participarão sempre</label><br>
                
                <input type="radio" id="events-alternate" name="extracurricular-events" value="revezarao">
                <label for="events-alternate">Se revezarão</label>
            </div>
            
            <div>
                <p>2.8. Se um dos genitores forem participar sempre e tiverem nova família, os novos membros poderão comparecer a eventos?</p>
                <input type="radio" id="new-family-yes" name="new-family" value="sim">
                <label for="new-family-yes">Sim</label><br>
                
                <input type="radio" id="new-family-no" name="new-family" value="nao">
                <label for="new-family-no">Não</label>
            </div>
        </fieldset>
    </form>
</body>
</html>
```

## Convites Extras e Gastos Extras

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acordo Parental - Convites Extras e Gastos Extras</title>
</head>
<body>
    <form id="parental-agreement">
        <h1>Acordo Parental</h1>
        
        <fieldset>
            <legend><h2>3. Convites Extras e Gastos Extras</h2></legend>
            
            <div>
                <p>3.1. Em aniversários aos quais o menor for convidado, quem decidirá sobre a participação?</p>
                <input type="radio" id="birthday-day-parent" name="birthday-decision" value="quem-estiver">
                <label for="birthday-day-parent">Quem estiver com o menor no dia</label><br>
                
                <input type="radio" id="birthday-both" name="birthday-decision" value="ambos">
                <label for="birthday-both">Ambos</label><br>
                
                <input type="radio" id="birthday-custody" name="birthday-decision" value="guarda-unilateral">
                <label for="birthday-custody">Aquele que detém a guarda unilateral</label>
                
                <p>Quem comprará o presente?</p>
                <input type="radio" id="gift-day-parent" name="gift-responsible" value="quem-estiver">
                <label for="gift-day-parent">Quem estiver com o menor no dia</label><br>
                
                <input type="radio" id="gift-father" name="gift-responsible" value="pai">
                <label for="gift-father">Pai</label><br>
                
                <input type="radio" id="gift-mother" name="gift-responsible" value="mae">
                <label for="gift-mother">Mãe</label><br>
                
                <input type="radio" id="gift-divided" name="gift-responsible" value="dividido">
                <label for="gift-divided">Dividido</label>
                <label for="gift-percentage">(em que porcentagem)</label>
                <input type="text" id="gift-percentage" name="gift-percentage" placeholder="Ex: Pai 70%, Mãe 30%">
            </div>
            
            <div>
                <p>3.2. Quando o menor quiser dormir na casa de um amigo, quem decidirá?</p>
                <input type="radio" id="sleepover-day-parent" name="sleepover-decision" value="quem-estiver">
                <label for="sleepover-day-parent">Quem estiver com o menor no dia</label><br>
                
                <input type="radio" id="sleepover-both" name="sleepover-decision" value="ambos">
                <label for="sleepover-both">Ambos</label><br>
                
                <input type="radio" id="sleepover-custody" name="sleepover-decision" value="guarda-unilateral">
                <label for="sleepover-custody">Aquele que detém a guarda unilateral</label>
            </div>
        </fieldset>
        
        <fieldset>
            <legend><h2>3. Comemoração do Aniversário</h2></legend>
            
            <div>
                <p>3.1. Como será organizada a comemoração do aniversário do menor?</p>
                <input type="radio" id="birthday-separate" name="birthday-organization" value="separado">
                <label for="birthday-separate">Cada genitor fará sua própria comemoração separadamente.</label><br>
                
                <input type="radio" id="birthday-together" name="birthday-organization" value="conjunto">
                <label for="birthday-together">A comemoração será única e organizada em conjunto pelos genitores.</label><br>
                
                <input type="radio" id="birthday-other" name="birthday-organization" value="outro">
                <label for="birthday-other">Outro acordo (especificar):</label>
                <input type="text" id="birthday-other-agreement" name="birthday-other-agreement">
            </div>
            
            <div>
                <p>3.2. Como serão divididos os custos da comemoração?</p>
                <input type="radio" id="cost-separate" name="birthday-costs" value="separado">
                <label for="cost-separate">Cada genitor será responsável pelos custos de sua própria comemoração.</label><br>
                
                <input type="radio" id="cost-equal" name="birthday-costs" value="igual">
                <label for="cost-equal">Os custos da comemoração única serão divididos igualmente.</label><br>
                
                <input type="radio" id="cost-percentage" name="birthday-costs" value="proporcao">
                <label for="cost-percentage">Os custos serão divididos na seguinte proporção:</label>
                <label for="cost-father">Pai</label>
                <input type="text" id="cost-father" name="cost-father" size="3" maxlength="3">%
                <label for="cost-mother">Mãe</label>
                <input type="text" id="cost-mother" name="cost-mother" size="3" maxlength="3">%
            </div>
            
            <div>
                <p>3.3. O outro genitor poderá participar da comemoração organizada por um dos genitores?</p>
                <input type="radio" id="participation-yes" name="other-parent-participation" value="sim-sem-restricoes">
                <label for="participation-yes">Sim, sem restrições.</label><br>
                
                <input type="radio" id="participation-conditional" name="other-parent-participation" value="sim-acordo">
                <label for="participation-conditional">Sim, desde que haja acordo prévio.</label><br>
                
                <input type="radio" id="participation-no" name="other-parent-participation" value="nao">
                <label for="participation-no">Não.</label>
                
                <p>- A família extensa do outro genitor poderá participar?</p>
                <input type="radio" id="family-yes" name="other-family-participation" value="sim-sem-restricoes">
                <label for="family-yes">Sim, sem restrições.</label><br>
                
                <input type="radio" id="family-conditional" name="other-family-participation" value="sim-acordo">
                <label for="family-conditional">Sim, desde que haja acordo prévio.</label><br>
                
                <input type="radio" id="family-no" name="other-family-participation" value="nao">
                <label for="family-no">Não.</label>
            </div>
            
            <div>
                <p>3.4. O menor terá participação na escolha do tema, convidados e programação da festa?</p>
                <input type="radio" id="child-choice-always" name="child-participation" value="sim-sempre">
                <label for="child-choice-always">Sim, sempre.</label><br>
                
                <input type="radio" id="child-choice-age" name="child-participation" value="sim-idade">
                <label for="child-choice-age">Sim, conforme a idade e maturidade da criança.</label>
                <label for="child-choice-which-age">(qual idade)</label>
                <input type="text" id="child-choice-which-age" name="child-choice-which-age" size="2" maxlength="2"><br>
                
                <input type="radio" id="child-choice-no" name="child-participation" value="nao">
                <label for="child-choice-no">Não, a decisão caberá ao(s) genitor(es) organizador(es).</label>
            </div>
            
            <div>
                <p>3.5. Se um terceiro (ex.: avós, padrinhos) quiser custear a festa, isso será permitido?</p>
                <input type="radio" id="third-party-yes" name="third-party-funding" value="sim-sem-restricoes">
                <label for="third-party-yes">Sim, sem restrições.</label><br>
                
                <input type="radio" id="third-party-conditional" name="third-party-funding" value="sim-acordo">
                <label for="third-party-conditional">Sim, desde que ambos os genitores concordem.</label><br>
                
                <input type="radio" id="third-party-no" name="third-party-funding" value="nao">
                <label for="third-party-no">Não.</label>
                
                <p>- Caso um terceiro custeie a festa, o outro genitor e sua família poderão participar?</p>
                <input type="radio" id="third-party-other-parent-yes" name="third-party-other-participation" value="sim">
                <label for="third-party-other-parent-yes">Sim.</label><br>
                
                <input type="radio" id="third-party-other-parent-conditional" name="third-party-other-participation" value="sim-acordo">
                <label for="third-party-other-parent-conditional">Sim, desde que haja acordo prévio.</label><br>
                
                <input type="radio" id="third-party-other-parent-no" name="third-party-other-participation" value="nao">
                <label for="third-party-other-parent-no">Não.</label>
            </div>
        </fieldset>
    </form>
</body>
</html>
```

## Uso de Telas e Redes Sociais

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acordo Parental - Uso de Telas e Redes Sociais</title>
</head>
<body>
    <form id="parental-agreement">
        <h1>Acordo Parental</h1>
        
        <fieldset>
            <legend><h2>4. Uso de Telas e Redes Sociais</h2></legend>
            
            <div>
                <p>4.1. A partir de qual idade o menor poderá ter seu próprio aparelho celular?</p>
                <input type="radio" id="phone-has" name="cell-phone-age" value="ja-tem">
                <label for="phone-has">Já tem</label><br>
                
                <input type="radio" id="phone-future" name="cell-phone-age" value="futuro">
                <label for="phone-future">Ainda não tem, terá com</label>
                <input type="number" id="phone-age" name="phone-age" min="1" max="18" style="width: 50px;"> anos
            </div>
            
            <div>
                <p>4.2. Quem será responsável pelo pagamento do aparelho e do plano telefônico?</p>
                <input type="radio" id="phone-father" name="phone-payment" value="pai">
                <label for="phone-father">Pai</label><br>
                
                <input type="radio" id="phone-mother" name="phone-payment" value="mae">
                <label for="phone-mother">Mãe</label><br>
                
                <input type="radio" id="phone-both" name="phone-payment" value="ambos">
                <label for="phone-both">Ambos</label>
                <label for="phone-percentage">(em que porcentagem)</label>
                <input type="text" id="phone-percentage" name="phone-percentage" placeholder="Ex: Pai 70%, Mãe 30%">
            </div>
            
            <div>
                <p>4.3. Qual será o limite de tempo de tela permitido?</p>
                <input type="number" id="screen-time" name="screen-time" min="0" max="1440" style="width: 70px;">
                <label for="screen-time">minutos (incluindo celular, vídeo game, televisão)</label>
            </div>
            
            <div>
                <p>4.4. O menor poderá ter perfis em redes sociais?</p>
                <input type="radio" id="social-media-yes" name="social-media" value="sim">
                <label for="social-media-yes">Sim</label><br>
                
                <input type="radio" id="social-media-no" name="social-media" value="nao">
                <label for="social-media-no">Não</label>
                
                <p>- Se sim, quais?</p>
                <div>
                    <input type="checkbox" id="instagram" name="social-networks" value="instagram">
                    <label for="instagram">Instagram</label><br>
                    
                    <input type="checkbox" id="tiktok" name="social-networks" value="tiktok">
                    <label for="tiktok">TikTok</label><br>
                    
                    <input type="checkbox" id="x" name="social-networks" value="x">
                    <label for="x">X</label>
                </div>
                
                <p>- Quem será responsável por supervisioná-los?</p>
                <input type="radio" id="supervision-both" name="social-supervision" value="ambos">
                <label for="supervision-both">Ambos</label><br>
                
                <input type="radio" id="supervision-father" name="social-supervision" value="pai">
                <label for="supervision-father">Pai</label><br>
                
                <input type="radio" id="supervision-mother" name="social-supervision" value="mae">
                <label for="supervision-mother">Mãe</label>
            </div>
            
            <div>
                <p>4.5. A publicação de fotos do menor em redes dos genitores sociais será permitida?</p>
                <input type="radio" id="photos-yes" name="social-photos" value="sim">
                <label for="photos-yes">Sim</label><br>
                
                <input type="radio" id="photos-no" name="social-photos" value="nao">
                <label for="photos-no">Não</label>
            </div>
        </fieldset>
    </form>
</body>
</html>
```

## Religião

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acordo Parental - Religião</title>
</head>
<body>
    <form id="parental-agreement">
        <h1>Acordo Parental</h1>
        
        <fieldset>
            <legend><h2>5. Religião</h2></legend>
            
            <div>
                <p>5.1. Qual a religião de cada genitor?</p>
                <label for="father-religion">Pai:</label>
                <input type="text" id="father-religion" name="father-religion"><br>
                
                <label for="mother-religion">Mãe:</label>
                <input type="text" id="mother-religion" name="mother-religion">
            </div>
            
            <div>
                <p>5.2. O menor será criado dentro de alguma religião específica?</p>
                <input type="radio" id="specific-religion-yes" name="specific-religion" value="sim">
                <label for="specific-religion-yes">Sim</label><br>
                
                <input type="radio" id="specific-religion-no" name="specific-religion" value="nao">
                <label for="specific-religion-no">Não</label><br>
                
                <label for="which-religion">Sim, qual?</label>
                <input type="text" id="which-religion" name="which-religion"><br>
                
                <label for="religion-until-age">Se sim, até que idade?</label>
                <input type="number" id="religion-until-age" name="religion-until-age" min="1" max="18" style="width: 50px;">
            </div>
            
            <div>
                <p>5.3. Caso ambos os genitores sigam a mesma religião, as datas comemorativas serão:</p>
                <input type="radio" id="holidays-alternate" name="same-religion-holidays" value="alternancia">
                <label for="holidays-alternate">A criança se alternará entre as residências</label><br>
                
                <input type="radio" id="holidays-together" name="same-religion-holidays" value="junto">
                <label for="holidays-together">As famílias irão celebrar junto</label>
                
                <p>- Caso os genitores não sejam da mesma religião o menor estará frequentará os feriados religiosos e datas comemorativas de ambas as religiões?</p>
                <input type="radio" id="different-holidays-yes" name="different-religion-holidays" value="sim">
                <label for="different-holidays-yes">Sim</label><br>
                
                <input type="radio" id="different-holidays-no" name="different-religion-holidays" value="nao">
                <label for="different-holidays-no">Não</label>
            </div>
            
            <div>
                <p>5.4. Se os genitores tiverem religiões diferentes, o menor frequentará ambos os templos?</p>
                <input type="radio" id="both-temples-yes" name="attend-temples" value="sim">
                <label for="both-temples-yes">Sim</label><br>
                
                <input type="radio" id="both-temples-no" name="attend-temples" value="nao">
                <label for="both-temples-no">Não</label><br>
                
                <input type="radio" id="one-temple" name="attend-temples" value="somente-um">
                <label for="one-temple">Somente o templo</label>
                <input type="text" id="which-temple" name="which-temple"><br>
                
                <label for="temple-until-age">Até que idade?</label>
                <input type="number" id="temple-until-age" name="temple-until-age" min="1" max="18" style="width: 50px;">
            </div>
            
            <div>
                <p>5.5. Quem será responsável por levar o menor a cultos ou cerimônias religiosas?</p>
                <input type="radio" id="ceremonies-father" name="religious-ceremonies" value="pai">
                <label for="ceremonies-father">Pai</label><br>
                
                <input type="radio" id="ceremonies-mother" name="religious-ceremonies" value="mae">
                <label for="ceremonies-mother">Mãe</label><br>
                
                <input type="radio" id="ceremonies-faith" name="religious-ceremonies" value="genitor-fe">
                <label for="ceremonies-faith">O genitor daquela fé</label>
            </div>
            
            <div>
                <p>5.6. A opinião do menor será levada em consideração?</p>
                <input type="radio" id="child-opinion-yes" name="child-opinion" value="sim">
                <label for="child-opinion-yes">Sim</label><br>
                
                <input type="radio" id="child-opinion-no" name="child-opinion" value="nao">
                <label for="child-opinion-no">Não</label><br>
                
                <input type="radio" id="child-opinion-age" name="child-opinion" value="a-partir-de">
                <label for="child-opinion-age">Se sim, a partir de</label>
                <input type="number" id="opinion-age" name="opinion-age" min="1" max="18" style="width: 50px;"> anos
            </div>
            
            <div>
                <p>5.7. Os feriados religiosos serão incluídos no calendário de convivência?</p>
                <input type="radio" id="religious-calendar-no" name="religious-calendar" value="nao">
                <label for="religious-calendar-no">Não</label><br>
                
                <input type="radio" id="religious-calendar-yes" name="religious-calendar" value="sim">
                <label for="religious-calendar-yes">Sim</label><br>
                
                <label for="which-holidays">São eles:</label>
                <input type="text" id="which-holidays" name="which-holidays"><br>
                
                <label for="holidays-with">Ficarão com o genitor</label>
                <input type="text" id="holidays-with" name="holidays-with">
            </div>
        </fieldset>
    </form>
</body>
</html>
```

## Viagens

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acordo Parental - Viagens</title>
</head>
<body>
    <form id="parental-agreement">
        <h1>Acordo Parental</h1>
        
        <fieldset>
            <legend><h2>6. Viagens</h2></legend>
            
            <div>
                <p>6.1. Quem será responsável pela obtenção (locomoção e burocracias) de passaporte e visto?</p>
                <input type="radio" id="documents-father" name="travel-documents" value="pai">
                <label for="documents-father">Pai</label><br>
                
                <input type="radio" id="documents-mother" name="travel-documents" value="mae">
                <label for="documents-mother">Mãe</label><br>
                
                <input type="radio" id="documents-traveling" name="travel-documents" value="quem-viajar">
                <label for="documents-traveling">Quem for fazer a viagem com o menor</label>
                
                <p>- Quem arcará com as despesas referente a essas burocracias?</p>
                <input type="radio" id="expenses-father" name="document-expenses" value="pai">
                <label for="expenses-father">Pai</label><br>
                
                <input type="radio" id="expenses-mother" name="document-expenses" value="mae">
                <label for="expenses-mother">Mãe</label><br>
                
                <input type="radio" id="expenses-traveling" name="document-expenses" value="quem-viajar">
                <label for="expenses-traveling">Quem for fazer a viagem com o menor</label>
            </div>
            
            <div>
                <p>6.2. Em viagens com amigos, intercâmbios ou colônias de férias, quem ficará responsável pelos custos?</p>
                <input type="radio" id="trip-costs-father" name="trip-costs" value="pai">
                <label for="trip-costs-father">Pai</label><br>
                
                <input type="radio" id="trip-costs-mother" name="trip-costs" value="mae">
                <label for="trip-costs-mother">Mãe</label><br>
                
                <input type="radio" id="trip-costs-divided" name="trip-costs" value="dividido">
                <label for="trip-costs-divided">Dividido</label>
                <label for="trip-percentage">(em que porcentagem)</label>
                <input type="text" id="trip-percentage" name="trip-percentage" placeholder="Ex: Pai 70%, Mãe 30%">
            </div>
            
            <div>
                <p>6.3. Se forem necessárias vacinas para a viagem, quem levará o menor?</p>
                <input type="radio" id="vaccines-father" name="travel-vaccines" value="pai">
                <label for="vaccines-father">Pai</label><br>
                
                <input type="radio" id="vaccines-mother" name="travel-vaccines" value="mae">
                <label for="vaccines-mother">Mãe</label><br>
                
                <input type="radio" id="vaccines-support" name="travel-vaccines" value="rede-apoio">
                <label for="vaccines-support">Alguém da rede de apoio?</label>
                <label for="vaccines-who">Quem:</label>
                <input type="text" id="vaccines-who" name="vaccines-who">
                
                <p>- Quem pagará?</p>
                <input type="radio" id="vaccine-costs-father" name="vaccine-costs" value="pai">
                <label for="vaccine-costs-father">Pai</label><br>
                
                <input type="radio" id="vaccine-costs-mother" name="vaccine-costs" value="mae">
                <label for="vaccine-costs-mother">Mãe</label><br>
                
                <input type="radio" id="vaccine-costs-divided" name="vaccine-costs" value="dividido">
                <label for="vaccine-costs-divided">Dividido</label>
                <label for="vaccine-percentage">(em que porcentagem)</label>
                <input type="text" id="vaccine-percentage" name="vaccine-percentage" placeholder="Ex: Pai 70%, Mãe 30%">
            </div>
            
            <div>
                <p>6.4. Caso a viagem ocorra com um dos genitores, poderá ultrapassar o período de convivência estipulado?</p>
                <input type="radio" id="extend-yes" name="extend-visitation" value="sim-sem-problemas">
                <label for="extend-yes">Sim, sem problemas</label><br>
                
                <input type="radio" id="extend-compensation" name="extend-visitation" value="sim-compensacao">
                <label for="extend-compensation">Sim, desde que haja compensação do período</label><br>
                
                <input type="radio" id="extend-no" name="extend-visitation" value="nao">
                <label for="extend-no">Não</label>
            </div>
        </fieldset>
    </form>
</body>
</html>
```

## Saúde

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acordo Parental - Saúde</title>
</head>
<body>
    <form id="parental-agreement">
        <h1>Acordo Parental</h1>
        
        <fieldset>
            <legend><h2>7. Saúde</h2></legend>
            
            <div>
                <p>7.1. O menor terá plano de saúde?</p>
                <input type="radio" id="health-plan-yes" name="health-plan" value="sim">
                <label for="health-plan-yes">Sim</label><br>
                
                <input type="radio" id="health-plan-no" name="health-plan" value="nao">
                <label for="health-plan-no">Não</label>
                
                <p>Quem pagará?</p>
                <input type="radio" id="health-plan-father" name="health-plan-payment" value="pai">
                <label for="health-plan-father">Pai</label><br>
                
                <input type="radio" id="health-plan-mother" name="health-plan-payment" value="mae">
                <label for="health-plan-mother">Mãe</label><br>
                
                <input type="radio" id="health-plan-both" name="health-plan-payment" value="ambos">
                <label for="health-plan-both">Ambos</label>
                <label for="health-plan-percentage">(em que porcentagem?)</label>
                <input type="text" id="health-plan-percentage" name="health-plan-percentage" placeholder="Ex: Pai 70%, Mãe 30%">
                
                <p>E plano odontológico?</p>
                <input type="radio" id="dental-plan-yes" name="dental-plan" value="sim">
                <label for="dental-plan-yes">Sim</label><br>
                
                <input type="radio" id="dental-plan-no" name="dental-plan" value="nao">
                <label for="dental-plan-no">Não</label>
                
                <p>Quem pagará?</p>
                <input type="radio" id="dental-plan-father" name="dental-plan-payment" value="pai">
                <label for="dental-plan-father">Pai</label><br>
                
                <input type="radio" id="dental-plan-mother" name="dental-plan-payment" value="mae">
                <label for="dental-plan-mother">Mãe</label><br>
                
                <input type="radio" id="dental-plan-both" name="dental-plan-payment" value="ambos">
                <label for="dental-plan-both">Ambos</label>
                <label for="dental-plan-percentage">(em que porcentagem?)</label>
                <input type="text" id="dental-plan-percentage" name="dental-plan-percentage" placeholder="Ex: Pai 70%, Mãe 30%">
            </div>
            
            <div>
                <p>7.2. Quem será responsável por levá-lo às consultas regulares?</p>
                <input type="radio" id="appointments-father" name="regular-appointments" value="pai">
                <label for="appointments-father">Pai</label><br>
                
                <input type="radio" id="appointments-mother" name="regular-appointments" value="mae">
                <label for="appointments-mother">Mãe</label><br>
                
                <input type="radio" id="appointments-both" name="regular-appointments" value="ambos">
                <label for="appointments-both">Ambos</label><br>
                
                <input type="radio" id="appointments-together" name="regular-appointments" value="juntos">
                <label for="appointments-together">Juntos</label><br>
                
                <input type="radio" id="appointments-alternate" name="regular-appointments" value="revezam">
                <label for="appointments-alternate">Se revezam</label>
            </div>
            
            <div>
                <p>7.3. Quem pagará despesas médicas não cobertas pelo plano de saúde?</p>
                <input type="radio" id="extra-medical-father" name="extra-medical-expenses" value="pai">
                <label for="extra-medical-father">Pai</label><br>
                
                <input type="radio" id="extra-medical-mother" name="extra-medical-expenses" value="mae">
                <label for="extra-medical-mother">Mãe</label><br>
                
                <input type="radio" id="extra-medical-divided" name="extra-medical-expenses" value="dividem">
                <label for="extra-medical-divided">Dividem</label>
                <label for="extra-medical-percentage">(em que porcentagem?)</label>
                <input type="text" id="extra-medical-percentage" name="extra-medical-percentage" placeholder="Ex: Pai 70%, Mãe 30%">
            </div>
            
            <div>
                <p>7.4. E medicamentos?</p>
                <input type="radio" id="medications-father" name="medications" value="pai">
                <label for="medications-father">Pai</label><br>
                
                <input type="radio" id="medications-mother" name="medications" value="mae">
                <label for="medications-mother">Mãe</label><br>
                
                <input type="radio" id="medications-divided" name="medications" value="dividem">
                <label for="medications-divided">Dividem</label>
                <label for="medications-percentage">(em que porcentagem?)</label>
                <input type="text" id="medications-percentage" name="medications-percentage" placeholder="Ex: Pai 70%, Mãe 30%">
            </div>
            
            <div>
                <p>7.5. O menor faz terapia?</p>
                <input type="radio" id="therapy-yes" name="therapy" value="sim">
                <label for="therapy-yes">Sim</label><br>
                
                <input type="radio" id="therapy-no" name="therapy" value="nao">
                <label for="therapy-no">Não</label>
                
                <p>Quem pagará?</p>
                <input type="radio" id="therapy-father" name="therapy-payment" value="pai">
                <label for="therapy-father">Pai</label><br>
                
                <input type="radio" id="therapy-mother" name="therapy-payment" value="mae">
                <label for="therapy-mother">Mãe</label><br>
                
                <input type="radio" id="therapy-both" name="therapy-payment" value="ambos">
                <label for="therapy-both">Ambos</label>
                <label for="therapy-percentage">(em que porcentagem?)</label>
                <input type="text" id="therapy-percentage" name="therapy-percentage" placeholder="Ex: Pai 70%, Mãe 30%">
                
                <p>Quem leva nas consultas?</p>
                <input type="radio" id="therapy-sessions-father" name="therapy-sessions" value="pai">
                <label for="therapy-sessions-father">Pai</label><br>
                
                <input type="radio" id="therapy-sessions-mother" name="therapy-sessions" value="mae">
                <label for="therapy-sessions-mother">Mãe</label><br>
                
                <input type="radio" id="therapy-sessions-support" name="therapy-sessions" value="rede-apoio">
                <label for="therapy-sessions-support">Alguém da rede de apoio?</label>
                <label for="therapy-who">(Quem?)</label>
                <input type="text" id="therapy-who" name="therapy-who">
            </div>
        </fieldset>
    </form>
</body>
</html>
```

## Rede de Apoio terceirizada

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acordo Parental - Rede de Apoio terceirizada</title>
</head>
<body>
    <form id="parental-agreement">
        <h1>Acordo Parental</h1>
        
        <fieldset>
            <legend><h2>8. Rede de Apoio terceirizada</h2></legend>
            
            <div>
                <p>8.1 Babás: quem será responsável pela escolha?</p>
                <input type="radio" id="babysitter-choice-father" name="babysitter-choice" value="pai">
                <label for="babysitter-choice-father">Pai</label><br>
                
                <input type="radio" id="babysitter-choice-mother" name="babysitter-choice" value="mae">
                <label for="babysitter-choice-mother">Mãe</label><br>
                
                <input type="radio" id="babysitter-choice-both" name="babysitter-choice" value="ambos">
                <label for="babysitter-choice-both">Ambos</label>
                
                <p>- E pelo pagamento?</p>
                <input type="radio" id="babysitter-payment-father" name="babysitter-payment" value="pai">
                <label for="babysitter-payment-father">Pai</label><br>
                
                <input type="radio" id="babysitter-payment-mother" name="babysitter-payment" value="mae">
                <label for="babysitter-payment-mother">Mãe</label><br>
                
                <input type="radio" id="babysitter-payment-who-hires" name="babysitter-payment" value="quem-contrata">
                <label for="babysitter-payment-who-hires">Aquele que decidir contratar o profissional.</label><br>
                
                <input type="radio" id="babysitter-payment-divided" name="babysitter-payment" value="dividido">
                <label for="babysitter-payment-divided">Será dividido, independente de quem decidiu fazer a contratação da(o) profissional.</label>
            </div>
        </fieldset>
    </form>
</body>
</html>
```

## Convivência

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acordo Parental - Convivência</title>
</head>
<body>
    <form id="parental-agreement">
        <h1>Acordo Parental</h1>
        
        <fieldset>
            <legend><h2>9. Convivência</h2></legend>
            
            <div>
                <p>(...)</p>
                
                <div>
                    <p>9.5. O menor poderá optar por não ir aos dias de convivência?</p>
                    <input type="radio" id="opt-out-yes" name="opt-out-visitation" value="sim">
                    <label for="opt-out-yes">Sim</label><br>
                    
                    <input type="radio" id="opt-out-no" name="opt-out-visitation" value="nao">
                    <label for="opt-out-no">Não</label><br>
                    
                    <label for="opt-out-age">Se sim a partir de qual idade?</label>
                    <input type="number" id="opt-out-age" name="opt-out-age" min="1" max="18" style="width: 50px;">
                </div>
                
                <div>
                    <p>9.6. Roupas e bens pessoais</p>
                    <input type="radio" id="personal-items-separate" name="personal-items" value="separado">
                    <label for="personal-items-separate">Cada pai deverá ter o seu</label><br>
                    
                    <input type="radio" id="personal-items-transport" name="personal-items" value="transporte">
                    <label for="personal-items-transport">Serão transportados a cada visita</label>
                </div>
            </div>
        </fieldset>
    </form>
</body>
</html>
```

## Consequências pelo Descumprimento do Plano

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acordo Parental - Consequências pelo Descumprimento do Plano</title>
</head>
<body>
    <form id="parental-agreement">
        <h1>Acordo Parental</h1>
        
        <fieldset>
            <legend><h2>10. Consequências pelo Descumprimento do Plano</h2></legend>
            
            <div>
                <p>10.1. O que acontece se um genitor não comparecer para buscar ou devolver o menor?</p>
                <input type="radio" id="no-show-nothing" name="no-show-consequence" value="nada">
                <label for="no-show-nothing">Nada</label><br>
                
                <input type="radio" id="no-show-lose-day" name="no-show-consequence" value="perde-dia">
                <label for="no-show-lose-day">Perde o dia de convivência</label><br>
                
                <input type="radio" id="no-show-fine" name="no-show-consequence" value="multa">
                <label for="no-show-fine">Deve pagar uma multa de</label>
                <input type="number" id="no-show-fine-percentage" name="no-show-fine-percentage" min="0" max="100" style="width: 60px;"> % do salário-mínimo
                
                <p>- E em caso de atraso para pegar ou devolver o menor?</p>
                <input type="radio" id="late-nothing" name="late-consequence" value="nada">
                <label for="late-nothing">Nada</label><br>
                
                <input type="radio" id="late-lose-day" name="late-consequence" value="perde-dia">
                <label for="late-lose-day">Perde o dia de convivência</label><br>
                
                <input type="radio" id="late-fine" name="late-consequence" value="multa">
                <label for="late-fine">Deve pagar uma multa de</label>
                <input type="number" id="late-fine-percentage" name="late-fine-percentage" min="0" max="100" style="width: 60px;"> % do salário-mínimo
            </div>
            
            <div>
                <p>10.2. Em caso de não pagamento de despesas médicas ou escolares, haverá direito ao reembolso em dobro?</p>
                <input type="radio" id="double-reimbursement-yes" name="double-reimbursement" value="sim">
                <label for="double-reimbursement-yes">Sim</label><br>
                
                <input type="radio" id="double-reimbursement-no" name="double-reimbursement" value="nao">
                <label for="double-reimbursement-no">Não</label>
            </div>
        </fieldset>
    </form>
</body>
</html>
```