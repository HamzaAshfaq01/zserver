// export const smtpHost = "mail.macsafety.com.pk"
//  const smtpPort = 465
// export const smtpUser = "test@macsafety.com.pk"
// export const smtpPass = "policez16AB*"

export const smtpHost = "mail.smtp2go.com"
 const smtpPort = 2525
export const smtpUser = "ziaja.io"
export const smtpPass = "jTb14PbXG2uF9bhS"

import nodemailer from 'nodemailer'


// MAIL_MAILER=smtp
// MAIL_HOST=mail.macsafety.com.pk
// MAIL_PORT=465
// MAIL_USERNAME=test@macsafety.com.pk
// MAIL_PASSWORD=policez16AB*
// MAIL_ENCRYPTION=null
// MAIL_FROM_ADDRESS=info@macsafety.com.pk 
// MAIL_FROM_NAME="MacSafety"

 const transporterOptions = {
  port: smtpPort,
  auth: {
    user: smtpUser,
    pass: smtpPass
  }
}

const style = `
background: #e8e8e8;
border:2px solid black;
border-radius: 25px;
background-color: black;
color:white;

`;

export const sendHTML = async (emailFrom , emailTo , subject , content) => {
    const message = {
        from: `Ziaja.Io<invester@ziaja.io>`,
        to: emailTo,
        bcc: '',
        subject: subject,
        html: `<div  style=${style}>
        <div style=' border:2px solid white;'>
        <div style=' background-color:white '>
        <img style='display: block; margin: 0 auto;' src='https://myghar.s3.ap-northeast-1.amazonaws.com/gHF5UVJoRE46O3QsK1wkU.jpeg'/>
        <h1 style='text-align:center ; color:black ;text-decoration: underline ; text-shadow: 2px 2px 4px #73aa43
        '>Welcome Ziaja.Io Website </h1></div>
        
        ${content}
        <div style='text-decoration: underline ;  background-color:white ; color:black ;'>
        <p style='padding-left:22px ; font-weight:bold ; text-align:center '> Ziaja.Io.com &copy; All Rights Reserved ${new Date().getFullYear()} </p>
       </div>
        </div>
        </div>`
      }
    
      transporterOptions.host = smtpHost
    
      const transporter = nodemailer.createTransport(transporterOptions)
      const info = await transporter.sendMail(message)
      console.log(info.messageId)
      return info
}

// const mailOptions = {
//     from: 'your-email@example.com', // Sender address
//     to: 'recipient@example.com', // List of recipients
//     subject: 'Hello', // Subject line
//     text: 'Hello world?', // Plain text body
//     html: '<b>Hello world?</b>', // HTML body
// };

// transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//         return console.log(error);
//     }
//     console.log('Message sent: %s', info.messageId);
// });









